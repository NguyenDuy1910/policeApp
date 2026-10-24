import { Body, Controller, Get, HttpCode, Inject, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { createReviewSchema, type CreateReviewInput } from '@vnpolice/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PublicService } from './public.service';

@Controller()
export class PublicController {
  constructor(@Inject(PublicService) private readonly publicService: PublicService) {}

  @Get('police-units')
  listPoliceUnits(@Query('q') search?: string) {
    return { policeUnits: this.publicService.listPoliceUnits(search) };
  }

  @Get('places')
  listPlaces(@Query('category') category?: string, @Query('q') search?: string) {
    return { places: this.publicService.listPlaces(category, search) };
  }

  @Get('places/:id/reviews')
  listReviews(@Param('id', ParseIntPipe) placeId: number) {
    return { reviews: this.publicService.listReviews(placeId) };
  }

  @Post('places/:id/reviews')
  @HttpCode(201)
  createReview(
    @Param('id', ParseIntPipe) placeId: number,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewInput,
  ) {
    return {
      review: this.publicService.createReview(placeId, input),
      message: 'Đánh giá đã được gửi và đang chờ kiểm duyệt.',
    };
  }
}
