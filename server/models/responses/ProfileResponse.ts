import type { PublicUserResponseModel } from "./UserResponses";

class ProfileResponseModel {
  constructor(readonly user: PublicUserResponseModel) {}
}

export default ProfileResponseModel;
