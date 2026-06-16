import { Request, Response, NextFunction } from 'express';
export declare function uploadRepo(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function scanPath(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getRepoById(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getRepoSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAllRepos(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getRepoFiles(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getFileContent(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=repoController.d.ts.map