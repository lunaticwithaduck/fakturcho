import { Module } from '@nestjs/common';
import { RenderModule } from '../render/render.module';
import { RenderService } from '../render/render.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EMAIL_SENDER, RENDER_SERVICE } from './ports';
import { ResendService } from './resend.service';

@Module({
  imports: [RenderModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    ResendService,
    { provide: RENDER_SERVICE, useExisting: RenderService },
    { provide: EMAIL_SENDER, useExisting: ResendService },
  ],
  exports: [EmailService],
})
export class EmailModule {}
