import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

import { TodoStatus } from "../../domain/Todo";
import {
  TodoSortField,
  TodoSortOrder,
} from "../../models/repositories/TodoModels";
import StringTransformer from "../../utils/StringTransformer";
import ValidationDecorators from "../../utils/ValidationDecorators";

enum TodoUpdateField {
  Title = "title",
  Description = "description",
  Status = "status",
  DueDate = "dueDate",
  AssignedToUserId = "assignedToUserId",
}

class CreateTodoRequestDto {
  @Transform(StringTransformer.trim)
  @IsString({ message: "Title must be text." })
  @IsNotEmpty({ message: "Title is required." })
  @MaxLength(200, { message: "Title must contain 200 characters or fewer." })
  declare title: string;

  @IsOptional()
  @Transform(StringTransformer.trim)
  @IsString({ message: "Description must be text." })
  declare description?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: "Due date must be a real date." })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Due date must use the YYYY-MM-DD format.",
  })
  declare dueDate?: string | null;

  @IsInt({ message: "A valid assignee is required." })
  @Min(1, { message: "A valid assignee is required." })
  declare assignedToUserId: number;
}

class UpdateTodoRequestDto {
  @ValidationDecorators.optionalButNotNull()
  @Transform(StringTransformer.trim)
  @IsString({ message: "Title must be text." })
  @IsNotEmpty({ message: "Title cannot be empty." })
  @MaxLength(200, { message: "Title must contain 200 characters or fewer." })
  declare title?: string;

  @ValidationDecorators.optionalButNotNull()
  @Transform(StringTransformer.trim)
  @IsString({ message: "Description must be text." })
  declare description?: string;

  @ValidationDecorators.optionalButNotNull()
  @IsEnum(TodoStatus, {
    message: "Status must be pending, in_progress, or completed.",
  })
  declare status?: TodoStatus;

  @ValidationDecorators.optionalButNotNull()
  @IsDateString({ strict: true }, { message: "Due date must be a real date." })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Due date must use the YYYY-MM-DD format.",
  })
  declare dueDate?: string;

  @ValidationDecorators.optionalButNotNull()
  @IsInt({ message: "A valid assignee is required." })
  @Min(1, { message: "A valid assignee is required." })
  declare assignedToUserId?: number;
}

class TodoListQueryDto {
  @IsOptional()
  @Transform(StringTransformer.trim)
  @IsString({ message: "Search must be text." })
  @MaxLength(100, { message: "Search must contain 100 characters or fewer." })
  declare search?: string;

  @IsOptional()
  @IsEnum(TodoSortField, {
    message: "Sort field must be status or dueDate.",
  })
  declare sortBy?: TodoSortField;

  @IsOptional()
  @IsEnum(TodoSortOrder, {
    message: "Sort order must be asc or desc.",
  })
  declare sortOrder?: TodoSortOrder;
}

class TodoIdParamsDto {
  @IsUUID("7", { message: "A valid to-do ID is required." })
  declare id: string;
}

export {
  CreateTodoRequestDto,
  TodoIdParamsDto,
  TodoListQueryDto,
  TodoUpdateField,
  UpdateTodoRequestDto,
};
