import {z} from 'zod';
export const profileSchema=z.object({display_name:z.string().trim().min(1,'Enter your name.').max(100,'Use 100 characters or fewer.')});
