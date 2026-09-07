export class CircuitBreaker {
 private failures=0;private openUntil=0;
 allowed(now:number){return now>=this.openUntil;}
 success(){this.failures=0;this.openUntil=0;}
 failure(now:number){if(++this.failures>=3)this.openUntil=now+30000;}
}
