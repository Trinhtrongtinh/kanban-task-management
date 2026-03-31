import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
  import { PaymentsService } from './payments.service';
import { CreateCheckoutDto, VerifySessionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { PaymentRateLimit } from '../../common/rate-limit';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  /**
   * Stripe webhook — receives payment events (no auth, raw body required)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      @Req() req: any,
  ): Promise<void> {
    await this.paymentsService.handleWebhook((req as any).rawBody, signature);
  }

  /**
   * Verify a completed Stripe checkout session and upgrade user if needed.
   * Called by the payment success page as a reliable fallback.
   */
  @Post('verify-session')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Session verified successfully')
  async verifySession(
    @Body() body: VerifySessionDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ upgraded: boolean }> {
    return this.paymentsService.verifySession(body.sessionId, userId);
  }

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
