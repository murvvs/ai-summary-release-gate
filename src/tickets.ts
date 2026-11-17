import { TICKETS as RAW } from '../public/tickets.js';
import type { Ticket } from './types';

export const TICKETS: Record<string, Ticket> = RAW;
