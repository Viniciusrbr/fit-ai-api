export class WorkoutPlanNotActiveError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'WorkoutPlanNotActiveError';
	}
}
