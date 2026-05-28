import useSWR from 'swr';
import { apiFetch } from '../utils/apiFetch';
import { FolderWithChildren } from '../types/frontend';

export const useFolders = () => {
  const fetcher = (url: string) => apiFetch(url);
  const { data, error, isLoading, mutate } = useSWR<FolderWithChildren[]>('/api/folders', fetcher);

  const createFolder = async (name: string, parent_id?: string | null) => {
    const newFolder = await apiFetch('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id })
    });
    mutate();
    return newFolder;
  };

  return { folders: data || [], isLoading, error, createFolder, mutateFolders: mutate };
};
