import { Module } from "@nestjs/common";
import { BrandingService } from "./branding.service";
import { BrandingController } from "./branding.controller";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  providers: [BrandingService],
  controllers: [BrandingController],
  exports: [BrandingService],
})
export class BrandingModule {}
