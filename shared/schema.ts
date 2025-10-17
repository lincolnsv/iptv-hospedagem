import { z } from "zod";

// Server status type
export interface ServerStatus {
  status: 'online' | 'offline';
  source: string;
  sources: string[];
  port: number;
  uptime: number;
}

export const serverStatusSchema = z.object({
  status: z.enum(['online', 'offline']),
  source: z.string(),
  sources: z.array(z.string()),
  port: z.number(),
  uptime: z.number(),
});

export type ServerStatusType = z.infer<typeof serverStatusSchema>;

// Channel type
export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  country?: string;
  language?: string;
  category?: string;
}

export const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  logo: z.string().optional(),
  group: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  category: z.string().optional(),
});

export type ChannelType = z.infer<typeof channelSchema>;

// Channels response type
export interface ChannelsResponse {
  channels: Channel[];
  total: number;
  countries: string[];
  categories: string[];
}

export const channelsResponseSchema = z.object({
  channels: z.array(channelSchema),
  total: z.number(),
  countries: z.array(z.string()),
  categories: z.array(z.string()),
});
