import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminSessionGuard } from './admin-session.guard.js';
import { exportSchema, type ExportQuery } from './admin.schemas.js';
import { BOM, toCsv } from './csv.js';
import { ExportService } from './export.service.js';

@Controller('admin/export')
@UseGuards(AdminSessionGuard)
@ApiCookieAuth('admin_sid')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  @Get()
  async export(@Query({ schema: exportSchema }) query: ExportQuery, @Res() res: Response) {
    const rows = await this.exporter.rows(query);
    const name = `dodep-${query.kind}-${new Date().toISOString().slice(0, 10)}.${query.format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    if (query.format === 'json') {
      res.json(rows);
      return;
    }
    res.type('text/csv; charset=utf-8').send(BOM + toCsv(rows));
  }
}
