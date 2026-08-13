import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccountId } from '../common/account-id.decorator';
import { buildAsciiFallbackFilename, buildContentDisposition } from './content-disposition';
import { RenderService } from './render.service';

@Controller('api/documents')
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Get(':id/render')
  async render(
    @Param('id') id: string,
    @AccountId() accountId: string,
    @Res() res: Response,
    @Query('disposition') disposition?: string,
  ): Promise<void> {
    const { buffer, filename, isDraft } = await this.renderService.renderPdf(id, accountId);
    const asciiFilename = buildAsciiFallbackFilename(filename);
    const dispositionType =
      isDraft || disposition === 'inline' ? ('inline' as const) : ('attachment' as const);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      buildContentDisposition(filename, asciiFilename, dispositionType),
    );
    res.send(buffer);
  }
}
