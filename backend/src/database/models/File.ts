import { Schema, model, Document } from 'mongoose';

export interface IFile extends Document {
  fileId: string;
  projectId: string;
  deletedAt?: Date | null;
  name: string;
  size: number;
  type: string;
  path: string;
  uploadedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    fileId: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    path: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: false },
  },
);

FileSchema.index({ projectId: 1, fileId: 1 });

export const FileModel = model<IFile>('File', FileSchema);
