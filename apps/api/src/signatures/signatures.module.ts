import { Module } from "@nestjs/common";
import { SignaturesService } from "./signatures.service";
import { SignaturesController } from "./signatures.controller";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  providers: [SignaturesService],
  controllers: [SignaturesController],
  exports: [SignaturesService],
})
export class SignaturesModule {}
