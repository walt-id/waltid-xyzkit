FROM docker.io/openjdk:17-slim-buster AS openjdk-gradle

ENV GRADLE_HOME /opt/gradle

RUN set -o errexit -o nounset \
    && echo "Adding gradle user and group" \
    && groupadd --system --gid 1000 gradle \
    && useradd --system --gid gradle --uid 1000 --shell /bin/bash --create-home gradle \
    && mkdir /home/gradle/.gradle \
    && chown --recursive gradle:gradle /home/gradle \
    \
    && echo "Symlinking root Gradle cache to gradle Gradle cache" \
    && ln -s /home/gradle/.gradle /root/.gradle

VOLUME /home/gradle/.gradle

WORKDIR /opt

RUN apt-get update && apt-get upgrade --yes

FROM openjdk-gradle AS walt-build
COPY ./ /opt
RUN ./gradlew clean build
RUN tar xf /opt/build/distributions/waltid-xyzkit-*.tar -C /opt

FROM waltid/waltid_iota_identity_wrapper:latest as iota_wrapper
FROM openjdk:17-slim-buster

ADD https://openpolicyagent.org/downloads/v0.41.0/opa_linux_amd64_static /usr/local/bin/opa
RUN chmod 755 /usr/local/bin/opa

COPY --from=iota_wrapper /usr/local/lib/libwaltid_iota_identity_wrapper.so /usr/local/lib/libwaltid_iota_identity_wrapper.so
RUN ldconfig
RUN mkdir /app
COPY --from=walt-build /opt/waltid-xyzkit-* /app/


WORKDIR /app

ENTRYPOINT ["/app/bin/waltid-xyzkit"]
