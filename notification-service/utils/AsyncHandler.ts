import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

type AsyncRequestHandler<ResponseBody> = (
  request: Request,
  response: Response<ResponseBody>,
  next: NextFunction
) => Promise<unknown>;

class AsyncHandler {
  static wrap<ResponseBody>(
    handler: AsyncRequestHandler<ResponseBody>
  ): RequestHandler {
    return (request, response, next) => {
      void handler(request, response, next).catch(next);
    };
  }
}

export default AsyncHandler;
