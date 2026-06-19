import { Global, Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-jwt"

@Global()
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	validate(): unknown {
		throw new Error("Method not implemented.")
	}
}
