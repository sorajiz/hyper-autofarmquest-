import { z } from 'zod';

export const DiscordQuestSchema = z.object({
	id: z.string(),
	config: z.object({
		expires_at: z.string(),
		messages: z.object({
			quest_name: z.string().optional().default('Discord Quest'),
			game_publisher: z.string().optional().default('Discord Partner'),
		}).passthrough(),
		task_config: z.object({
			tasks: z.record(z.string(), z.any()).optional().default({}),
		}).passthrough().optional(),
	}).passthrough(),
	user_status: z.object({
		enrolled_at: z.string().nullable().optional(),
		completed_at: z.string().nullable().optional(),
		claimed_at: z.string().nullable().optional(),
		progress: z.record(z.string(), z.any()).optional().default({}),
	}).nullable().optional(),
}).passthrough();

export const AllQuestsResponseSchema = z.object({
	quests: z.array(DiscordQuestSchema).optional().default([]),
	excluded_quests: z.array(z.any()).optional().default([]),
	quest_enrollment_blocked_until: z.string().nullable().optional(),
	quest_access_suspended_until: z.string().nullable().optional(),
}).passthrough();

export type ValidatedQuest = z.infer<typeof DiscordQuestSchema>;
export type ValidatedAllQuestsResponse = z.infer<typeof AllQuestsResponseSchema>;
