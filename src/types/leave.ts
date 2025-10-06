// src/types/leave.ts
export enum LeaveType {
    SICK = "SICK",
    CASUAL = "CASUAL",
    EARNED = "EARNED",
    UNPAID = "UNPAID",
}
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRequest {
  id: number;
  startDate: string; // LocalDate
  endDate: string; // LocalDate
  type: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedOn: string; // LocalDateTime
}