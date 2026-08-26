import type { AssignmentUserResponseModel } from "./UserResponses";

class UserListResponseModel {
  constructor(readonly users: AssignmentUserResponseModel[]) {}
}

export default UserListResponseModel;
