import { Module } from "@nestjs/common";
import { FailedEmailsService } from "./failed-emails.service";
import { FailedEmailsController } from "./failed-emails.controller";
import { QueueModule } from "../queue/queue.module";
import { CampaignsModule } from "../campaigns/campaigns.module";

@Module({
  imports: [QueueModule, CampaignsModule],
  providers: [FailedEmailsService],
  controllers: [FailedEmailsController],
})
export class FailedEmailsModule {}
