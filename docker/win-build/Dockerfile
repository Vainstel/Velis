FROM electronuserland/builder:wine

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm ci

ENV WINEARCH=win64
ENV WINEDEBUG=-all

# Install UV for Linux to use during build
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    export PATH="$HOME/.local/bin:$PATH"

# Make sure uv is available in PATH
ENV PATH="/root/.local/bin:${PATH}"

CMD ["npm", "run", "package:windows"]