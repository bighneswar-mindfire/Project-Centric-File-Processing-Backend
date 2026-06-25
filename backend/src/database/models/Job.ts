import { Schema, model, Document } from 'mongoose';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IJob extends Document {
  jobId: string;
  projectId: string;
  type: 'ZIP_COMPRESSION';
  status: JobStatus;
  progress: number;
  fileIds: string[];
  outputFileId?: string;
  error?: string;
  startedAt?: Date;
  deletedAt?: Date | null;
  completedAt?: Date;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    type: { type: String, required: true, default: 'ZIP_COMPRESSION' },
    status: {
      type: String,
      required: true,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
    },
    progress: { type: Number, required: true, default: 0, min: 0, max: 100 },
    fileIds: { type: [String], required: true },
    outputFileId: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: true },
  },
);

JobSchema.index({ projectId: 1, createdAt: -1 });

export const JobModel = model<IJob>('Job', JobSchema);
