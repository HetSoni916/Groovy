import { Repository, RepoSummary } from '../types';
export declare function processRepo(name: string, dirPath: string): Promise<Repository>;
export declare function getRepo(id: string): Repository | undefined;
export declare function getSummary(id: string): RepoSummary | undefined;
export declare function listRepos(): {
    id: string;
    name: string;
    createdAt: string;
    totalFiles: number;
}[];
//# sourceMappingURL=repoService.d.ts.map