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
    const exists = await FileModel.exists({ fileId });
    return !!exists;
  },

  findOne: async (projectId: string, fileId: string): Promise<IFile | null> => {
    return FileModel.findOne({ projectId, fileId });
  },

  findManyByQuery: async (query: object): Promise<IFile[]> => {
    return FileModel.find(query);
  },

  findProjectFiles: async (projectId: string): Promise<IFile[]> => {
    return FileModel.find({ projectId }).select('fileId name size uploadedAt -_id');
  },

  count: async (projectId: string): Promise<number> => {
    return FileModel.countDocuments({ projectId });
  },

  deleteOne: async (projectId: string, fileId: string) => {
    return FileModel.deleteOne({ projectId, fileId });
  },

  deleteMany: async (projectId: string) => {
    return FileModel.deleteMany({ projectId });
  },
};
