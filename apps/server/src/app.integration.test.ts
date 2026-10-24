import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module';
import { seedPlaces, seedPoliceUnits, seedReports } from './database/seed-data';
import { configureApp } from './configure-app';

describe('VNPolice Care API workflow', () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vnpolice-care-'));
  let app: INestApplication;
  let adminCookie = '';
  let reportId = '';
  let accessToken = '';

  beforeAll(async () => {
    process.env.DATABASE_PATH = join(temporaryDirectory, 'integration.sqlite');
    process.env.UPLOAD_DIR = join(temporaryDirectory, 'uploads');
    process.env.SESSION_SECRET = 'integration-test-secret-with-more-than-32-characters';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'DemoAdmin!2026';
    process.env.ADMIN_DISPLAY_NAME = 'Trực ban Trung tâm Chỉ huy';
    process.env.AUTO_SEED = 'true';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('runs the private citizen-to-admin workflow and persists it across restart', async () => {
    await supertest(app.getHttpServer()).get('/api/health').expect(200).expect(({ body }) => {
      expect(body.framework).toBe('nestjs');
    });

    const publicPlaces = await supertest(app.getHttpServer()).get('/api/places').expect(200);
    expect(publicPlaces.body.places).toHaveLength(seedPlaces.length);
    const publicUnits = await supertest(app.getHttpServer()).get('/api/police-units').expect(200);
    expect(publicUnits.body.policeUnits).toHaveLength(seedPoliceUnits.length);

    await supertest(app.getHttpServer()).get('/api/admin/reports').expect(401);
    const login = await supertest(app.getHttpServer())
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'DemoAdmin!2026' })
      .expect(200);
    const cookieHeader = login.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();
    adminCookie = (Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader])
      .map((cookie) => String(cookie).split(';')[0])
      .join('; ');

    const seededReports = await supertest(app.getHttpServer()).get('/api/admin/reports').set('Cookie', adminCookie).expect(200);
    expect(seededReports.body.reports).toHaveLength(seedReports.length);
    const seededCase = seededReports.body.reports.find((report: { status: string }) => report.status === 'resolved');
    const seededDetail = await supertest(app.getHttpServer())
      .get(`/api/admin/reports/${seededCase.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(seededDetail.body.history.map((entry: { status: string }) => entry.status)).toEqual(['submitted', 'received', 'processing', 'resolved']);
    expect(seededDetail.body.history[0].actorName).toBe('Người báo tin');
    expect(seededDetail.body.history[1].actorName).toBe('Trực ban Trung tâm Chỉ huy');
    expect(seededDetail.body.report.assignedPoliceUnit.id).toBe(seededDetail.body.report.suggestedPoliceUnit.id);
    const seededPhotoCase = seededReports.body.reports.find((report: { attachmentAvailable: boolean }) => report.attachmentAvailable);
    expect(seededPhotoCase).toBeDefined();
    await supertest(app.getHttpServer())
      .get(`/api/admin/reports/${seededPhotoCase.id}`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect(({ body }) => {
        expect(body.report.attachmentAvailable).toBe(true);
        expect(body.report.attachmentOriginalName).toMatch(/\.jpg$/);
        expect(body.report.attachmentSize).toBeGreaterThan(100_000);
      });
    await supertest(app.getHttpServer())
      .get(`/api/admin/reports/${seededPhotoCase.id}/attachment`)
      .set('Cookie', adminCookie)
      .expect('Content-Type', /image\/jpeg/)
      .expect(200);


    await supertest(app.getHttpServer())
      .patch('/api/admin/police-units/1')
      .set('Cookie', adminCookie)
      .send({
        latitude: 9.1767,
        longitude: 105.1524,
        address: 'Tọa độ kiểm thử quản trị',
        verified: true,
        verificationSource: 'Nguồn xác minh kiểm thử',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.policeUnit.verified).toBe(true);
      });

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const submission = await supertest(app.getHttpServer())
      .post('/api/reports')
      .field('incidentType', 'traffic_accident')
      .field('description', 'Va chạm tại giao lộ trong kịch bản kiểm thử.')
      .field('incidentLatitude', '9.1768')
      .field('incidentLongitude', '105.1525')
      .field('reporterLatitude', '9.1769')
      .field('reporterLongitude', '105.1526')
      .field('gpsAccuracy', '8.5')
      .attach('attachment', png, { filename: 'incident.png', contentType: 'image/png' })
      .expect(201);
    reportId = submission.body.report.id;
    accessToken = submission.body.accessToken;
    expect(reportId).toMatch(/^VN-\d{8}-[A-Z0-9]+$/);
    expect(accessToken.length).toBeGreaterThan(32);
    expect(submission.body.report.suggestedPoliceUnit.id).toBe(1);
    expect(submission.body.report.incidentLatitude).toBe(9.1768);
    expect(submission.body.report.reporterLatitude).toBe(9.1769);
    expect(submission.body.report.attachmentAvailable).toBe(true);
    expect(submission.body.report.attachmentOriginalName).toBe('incident.png');
    expect(submission.body.report.attachmentSize).toBe(png.length);

    await supertest(app.getHttpServer()).get(`/api/reports/${reportId}`).expect(404);
    await supertest(app.getHttpServer()).get(`/api/reports/${reportId}`).set('x-report-token', 'wrong-token').expect(404);
    await supertest(app.getHttpServer()).get(`/api/reports/${reportId}/attachment`).expect(404);
    await supertest(app.getHttpServer()).get(`/api/reports/${reportId}/attachment`).set('x-report-token', 'wrong-token').expect(404);
    await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}/attachment`)
      .set('x-report-token', accessToken)
      .expect('Content-Type', /image\/png/)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(png);
      });
    await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}`)
      .set('x-report-token', accessToken)
      .expect(200)
      .expect(({ body }) => {
        expect(body.report.status).toBe('submitted');
      });

    const adminReports = await supertest(app.getHttpServer())
      .get('/api/admin/reports?status=submitted&incidentType=traffic_accident')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(adminReports.body.reports.some((report: { id: string }) => report.id === reportId)).toBe(true);

    await supertest(app.getHttpServer())
      .patch(`/api/admin/reports/${reportId}/assignment`)
      .set('Cookie', adminCookie)
      .send({ policeUnitId: 1 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.report.assignedPoliceUnit.id).toBe(1);
      });

    await supertest(app.getHttpServer())
      .patch(`/api/admin/reports/${reportId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'received' })
      .expect(200);
    const citizenHistory = await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}/history`)
      .set('x-report-token', accessToken)
      .expect(200);
    expect(citizenHistory.body.history.map((entry: { status: string }) => entry.status)).toEqual(['submitted', 'received']);

    await supertest(app.getHttpServer())
      .get(`/api/admin/reports/${reportId}/attachment`)
      .set('Cookie', adminCookie)
      .expect('Content-Type', /image\/png/)
      .expect(200);

    await supertest(app.getHttpServer())
      .patch(`/api/admin/reports/${reportId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'processing' })
      .expect(200);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/reports/${reportId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'resolved' })
      .expect(200);

    const reviewSubmission = await supertest(app.getHttpServer())
      .post('/api/places/3/reviews')
      .send({ authorName: 'Người kiểm thử', rating: 5, comment: 'Nội dung đánh giá gửi qua API.' })
      .expect(201);
    expect(reviewSubmission.body.review.status).toBe('pending');
    const reviewsBeforeModeration = await supertest(app.getHttpServer()).get('/api/places/3/reviews').expect(200);
    const approvedBefore = reviewsBeforeModeration.body.reviews.length;
    expect(reviewsBeforeModeration.body.reviews.some((review: { id: number }) => review.id === reviewSubmission.body.review.id)).toBe(false);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/reviews/${reviewSubmission.body.review.id}`)
      .set('Cookie', adminCookie)
      .send({ status: 'approved' })
      .expect(200);
    const reviewsAfterModeration = await supertest(app.getHttpServer()).get('/api/places/3/reviews').expect(200);
    expect(reviewsAfterModeration.body.reviews).toHaveLength(approvedBefore + 1);

    const createdUnit = await supertest(app.getHttpServer())
      .post('/api/admin/police-units')
      .set('Cookie', adminCookie)
      .send({ name: 'Đơn vị kiểm thử', administrativeLevel: 'Công an xã', verified: false, active: true })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/police-units/${createdUnit.body.policeUnit.id}`)
      .set('Cookie', adminCookie)
      .send({
        address: '12 đường Kiểm Thử',
        dutyHotline: '02903830000',
        latitude: 9.18,
        longitude: 105.16,
      })
      .expect(200);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/police-units/${createdUnit.body.policeUnit.id}`)
      .set('Cookie', adminCookie)
      .send({ address: null, dutyHotline: null, latitude: null, longitude: null, active: false })
      .expect(200)
      .expect(({ body }) => {
        expect(body.policeUnit).toMatchObject({
          address: null,
          dutyHotline: null,
          latitude: null,
          longitude: null,
          active: false,
        });
      });

    const createdPlace = await supertest(app.getHttpServer())
      .post('/api/admin/places')
      .set('Cookie', adminCookie)
      .send({
        name: 'Cơ sở kiểm thử',
        category: 'service',
        address: 'Địa chỉ kiểm thử',
        latitude: 9.18,
        longitude: 105.16,
        verified: false,
        dataSource: 'TEST_DATA',
        active: true,
      })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/places/${createdPlace.body.place.id}`)
      .set('Cookie', adminCookie)
      .send({ verified: true, verificationSource: 'Nguồn kiểm thử' })
      .expect(200);
    await supertest(app.getHttpServer())
      .patch(`/api/admin/places/${createdPlace.body.place.id}`)
      .set('Cookie', adminCookie)
      .send({ verified: false, verificationSource: null })
      .expect(200)
      .expect(({ body }) => {
        expect(body.place.verificationSource).toBeNull();
      });

    let reviewRateLimited = false;
    for (let index = 0; index < 25; index += 1) {
      const response = await supertest(app.getHttpServer())
        .post('/api/places/2/reviews')
        .send({ authorName: 'Kiểm thử giới hạn', rating: 4, comment: `Đánh giá giới hạn ${index}` });
      if (response.status === 429) {
        reviewRateLimited = true;
        break;
      }
    }
    expect(reviewRateLimited).toBe(true);

    await app.close();
    const restartedModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = restartedModule.createNestApplication();
    configureApp(app);
    await app.init();
    await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}`)
      .set('x-report-token', accessToken)
      .expect(200)
      .expect(({ body }) => {
        expect(body.report.status).toBe('resolved');
        expect(body.report.assignedPoliceUnit.id).toBe(1);
      });
    await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}/attachment`)
      .set('x-report-token', accessToken)
      .expect('Content-Type', /image\/png/)
      .expect(200);
    const uploadedFile = readdirSync(join(temporaryDirectory, 'uploads')).find((name) => name.endsWith('.png'));
    expect(uploadedFile).toBeDefined();
    unlinkSync(join(temporaryDirectory, 'uploads', uploadedFile!));
    await supertest(app.getHttpServer())
      .get(`/api/reports/${reportId}/attachment`)
      .set('x-report-token', accessToken)
      .expect(404);
    const restartedLogin = await supertest(app.getHttpServer())
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'DemoAdmin!2026' })
      .expect(200);
    const restartedCookieHeader = restartedLogin.headers['set-cookie'];
    const restartedAdminCookie = (Array.isArray(restartedCookieHeader) ? restartedCookieHeader : [restartedCookieHeader])
      .map((cookie) => String(cookie).split(';')[0])
      .join('; ');
    await supertest(app.getHttpServer())
      .get(`/api/admin/reports/${reportId}/attachment`)
      .set('Cookie', restartedAdminCookie)
      .expect(404);
  });

  it('rejects malformed coordinates and disguised uploads', async () => {
    await supertest(app.getHttpServer())
      .post('/api/reports')
      .field('incidentType', 'traffic_accident')
      .field('incidentLatitude', '999')
      .field('incidentLongitude', '105')
      .expect(400);
    await supertest(app.getHttpServer())
      .post('/api/reports')
      .field('incidentType', 'traffic_accident')
      .field('incidentLatitude', '9.17')
      .field('incidentLongitude', '105.15')
      .attach('attachment', Buffer.from('not-an-image'), { filename: 'fake.png', contentType: 'image/png' })
      .expect(400);
    await supertest(app.getHttpServer())
      .post('/api/reports')
      .field('incidentType', 'traffic_accident')
      .field('incidentLatitude', '9.17')
      .field('incidentLongitude', '105.15')
      .attach('attachment', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' })
      .expect(413);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    await supertest(app.getHttpServer())
      .post('/api/reports')
      .field('incidentType', 'traffic_accident')
      .field('incidentLatitude', '9.17')
      .field('incidentLongitude', '105.15')
      .attach('attachment', png, { filename: 'first.png', contentType: 'image/png' })
      .attach('attachment', png, { filename: 'second.png', contentType: 'image/png' })
      .expect(400);
  });
});
