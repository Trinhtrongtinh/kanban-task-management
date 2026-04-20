"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../../config");
let StripeService = StripeService_1 = class StripeService {
    stripeSettings;
    logger = new common_1.Logger(StripeService_1.name);
    stripe;
    constructor(stripeSettings) {
        this.stripeSettings = stripeSettings;
        const secretKey = this.stripeSettings.secretKey;
        if (!secretKey || secretKey === 'sk_test_xxx') {
            this.logger.warn('Stripe secret key not configured. Payment features will be disabled.');
            return;
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2026-02-25.clover',
        });
        this.logger.log('Stripe initialized successfully');
    }
    async createCheckoutSession(params) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        const sessionParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: params.priceId,
                    quantity: 1,
                },
            ],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            client_reference_id: params.userId,
            metadata: {
                userId: params.userId,
            },
        };
        if (params.stripeCustomerId) {
            sessionParams.customer = params.stripeCustomerId;
        }
        else {
            sessionParams.customer_email = params.customerEmail;
        }
        return this.stripe.checkout.sessions.create(sessionParams);
    }
    constructWebhookEvent(payload, signature, webhookSecret) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
    async retrieveSession(sessionId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        return this.stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'customer'],
        });
    }
    async retrieveSubscription(subscriptionId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        return this.stripe.subscriptions.retrieve(subscriptionId);
    }
    async cancelSubscription(subscriptionId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        return this.stripe.subscriptions.cancel(subscriptionId);
    }
    async createPortalSession(customerId, returnUrl) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        return this.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
    }
    isInitialized() {
        return !!this.stripe;
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.stripeConfig.KEY)),
    __metadata("design:paramtypes", [void 0])
], StripeService);
//# sourceMappingURL=stripe.service.js.map