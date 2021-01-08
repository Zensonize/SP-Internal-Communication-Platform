import { Document } from 'mongoose';
export interface TimelyDocument extends Document {
    createdAt: Date;
    updatedAt: Date;
}
