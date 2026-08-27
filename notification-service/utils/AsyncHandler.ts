import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

type AsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

class AsyncHandler {
  static wrap(handler: AsyncRequestHandler): RequestHandler {
    return (request, response, next) => {
      void handler(request, response, next).catch(next);
    };
  }
}

export default AsyncHandler;
