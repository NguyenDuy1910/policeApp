import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateReviewInput, Place, PoliceUnit, Review } from '@vnpolice/shared';
import { DatabaseService } from '../database/database.service';
import { mapPlace, mapPoliceUnit, mapReview } from '../database/mappers';

@Injectable()
export class PublicService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  listPoliceUnits(search?: string): PoliceUnit[] {
    const query = search?.trim();
    const rows = query
      ? this.database.connection
          .prepare('SELECT * FROM police_units WHERE active = 1 AND (name LIKE ? OR COALESCE(address, \'\') LIKE ?) ORDER BY verified DESC, name')
          .all(`%${query}%`, `%${query}%`)
      : this.database.connection.prepare('SELECT * FROM police_units WHERE active = 1 ORDER BY verified DESC, name').all();
    return (rows as Record<string, unknown>[]).map((row) => mapPoliceUnit(row));
  }

  listPlaces(category?: string, search?: string): Place[] {
    if (category && category !== 'food' && category !== 'service') throw new BadRequestException('Loại địa điểm không hợp lệ.');
    const clauses = ['p.active = 1'];
    const parameters: unknown[] = [];
    if (category) {
      clauses.push('p.category = ?');
      parameters.push(category);
    }
    if (search?.trim()) {
      clauses.push('(p.name LIKE ? OR p.address LIKE ?)');
      parameters.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    const rows = this.database.connection
      .prepare(`
        SELECT p.*, AVG(CASE WHEN r.status = 'approved' THEN r.rating END) AS average_rating,
          COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS review_count
        FROM places p
        LEFT JOIN reviews r ON r.place_id = p.id
        WHERE ${clauses.join(' AND ')}
        GROUP BY p.id
        ORDER BY p.verified DESC, p.name
      `)
      .all(...parameters) as Record<string, unknown>[];
    return rows.map((row) => mapPlace(row));
  }

  listReviews(placeId: number): Review[] {
    this.ensurePlaceExists(placeId);
    const rows = this.database.connection
      .prepare("SELECT * FROM reviews WHERE place_id = ? AND status = 'approved' ORDER BY created_at DESC")
      .all(placeId) as Record<string, unknown>[];
    return rows.map((row) => mapReview(row));
  }

  createReview(placeId: number, input: CreateReviewInput): ReturnType<typeof mapReview> {
    this.ensurePlaceExists(placeId);
    const timestamp = new Date().toISOString();
    const result = this.database.connection
      .prepare(`
        INSERT INTO reviews (place_id, author_name, rating, comment, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `)
      .run(placeId, input.authorName, input.rating, input.comment, timestamp, timestamp);
    const row = this.database.connection.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    return mapReview(row);
  }

  private ensurePlaceExists(placeId: number): void {
    if (!Number.isInteger(placeId) || placeId <= 0) throw new BadRequestException('Mã địa điểm không hợp lệ.');
    const place = this.database.connection.prepare('SELECT id FROM places WHERE id = ? AND active = 1').get(placeId);
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm.');
  }
}
