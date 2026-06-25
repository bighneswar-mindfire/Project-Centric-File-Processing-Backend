import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  name: string;
  description: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const ProjectModel = model<IProject>('Project', ProjectSchema);
