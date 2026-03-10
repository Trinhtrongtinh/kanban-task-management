import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, ResponseMessage } from '../../common/decorators';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create Stripe checkout session
   */
  @Post('create-checkout-session')
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
   * Handle Stripe webhook
   * IMPORTANT: This route must receive raw body for signature verification
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    const rawBody = req.rawBody;

    if (!rawBody) {
      res.status(400).send('Missing raw body');
      return;
    }

    try {
      await this.paymentsService.handleWebhook(rawBody, signature);
      res.status(200).json({ received: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Portal session created successfully')
  async createPortalSession(
    @CurrentUser('userId') userId: string,
  ): Promise<{ url: string }> {
    return this.paymentsService.createPortalSession(userId);
  }
}
