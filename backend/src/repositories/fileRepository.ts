import { FileModel, IFile } from '../database/models/File.js';

export interface FileInputData {
  fileId: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

export const fileRepository = {
  create: async (data: FileInputData): Promise<IFile> => {
    const newFile = new FileModel(data);
    return newFile.save();
  },

  exists: async (fileId: string): Promise<boolean> => {
    const exists = await FileModel.exists({ fileId, deletedAt: null });
    return !!exists;
  },

  findOne: async (projectId: string, fileId: string): Promise<IFile | null> => {
    return FileModel.findOne({ projectId, fileId, deletedAt: null });
  },

  findManyByQuery: async (query: object): Promise<IFile[]> => {
    return FileModel.find({ ...query, deletedAt: null });
  },

  findProjectFiles: async (projectId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const data = await FileModel.find({ projectId, deletedAt: null })
      .select('fileId name size uploadedAt -_id')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FileModel.countDocuments({ projectId, deletedAt: null });
    return { data, total };
  },

  count: async (projectId: string): Promise<number> => {
    return FileModel.countDocuments({ projectId, deletedAt: null });
  },

  softDelete: async (projectId: string, fileId: string) => {
    return FileModel.updateOne(
      { projectId, fileId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );
  },

  softDeleteMany: async (projectId: string) => {
    return FileModel.updateMany(
      { projectId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );
  },
};
