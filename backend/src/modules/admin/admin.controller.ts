import { Controller, Get } from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@AdminOnly()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }
}
