import { Controller, Get, Param, Res } from '@nestjs/common';
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
  ): Promise<void> {
    const { buffer, filename } = await this.renderService.renderPdf(id, accountId);
    const asciiFilename = buildAsciiFallbackFilename(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', buildContentDisposition(filename, asciiFilename));
    res.send(buffer);
  }
}
