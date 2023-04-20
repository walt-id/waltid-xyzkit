package id.walt

import io.ktor.http.*

open class WebException(val status: HttpStatusCode, message: String): Exception(message)

class UnauthorizedException(message: String): WebException(HttpStatusCode.Unauthorized, message)
