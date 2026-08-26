import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

type AsyncRequestHandler<Params, ResponseBody, RequestBody, RequestQuery> = (
  request: Request<Params, ResponseBody, RequestBody, RequestQuery>,
  response: Response<ResponseBody>,
  next: NextFunction
) => Promise<Response<ResponseBody> | void>;

class AsyncHandler {
  static wrap<Params, ResponseBody, RequestBody, RequestQuery>(
    handler: AsyncRequestHandler<
      Params,
      ResponseBody,
      RequestBody,
      RequestQuery
    >
  ): RequestHandler<Params, ResponseBody, RequestBody, RequestQuery> {
    return (request, response, next) => {
      void handler(request, response, next).catch(next);
    };
  }
}

export default AsyncHandler;
