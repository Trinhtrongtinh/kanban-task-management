import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { PaymentRateLimit } from '../../common/rate-limit';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create Stripe checkout session
   */
  @Post('create-checkout-session')
  @PaymentRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Checkout session created successfully')
  async createCheckoutSession(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ url: string; sessionId: string }> {
    return this.paymentsService.createCheckoutSession(
      createCheckoutDto,
      userId,
    );
  }

  /**
   * Get current user's billing info
   */
  @Get('billing')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Billing info retrieved successfully')
  async getBillingInfo(@CurrentUser('userId') userId: string) {
    return this.paymentsService.getBillingInfo(userId);
  }

  /**
   * Create customer portal session for managing subscription
   */
  @Post('portal-session')
  @PaymentRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Portal session created successfully')
  async createPortalSession(
    @CurrentUser('userId') userId: string,
  ): Promise<{ url: string }> {
    return this.paymentsService.createPortalSession(userId);
  }
}
