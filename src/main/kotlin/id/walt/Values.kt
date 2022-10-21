package id.walt

object Values {
    const val version = "1.22102117"
    val isSnapshot: Boolean
        get() = version.contains("SNAPSHOT")
}
