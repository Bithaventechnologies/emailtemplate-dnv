import { Module } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { CampaignsController } from "./campaigns.controller";
import { SuppressionService } from "./suppression.service";
import { BrandingModule } from "../branding/branding.module";
import { SignaturesModule } from "../signatures/signatures.module";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [BrandingModule, SignaturesModule, QueueModule],
  providers: [CampaignsService, SuppressionService],
  controllers: [CampaignsController],
  exports: [CampaignsService, SuppressionService],
})
export class CampaignsModule {}
