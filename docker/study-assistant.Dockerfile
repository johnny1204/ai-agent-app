FROM node:20-bookworm

# Install python and pipx for NotebookLM MCP CLI
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv pipx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add pipx to PATH
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app/study-assistant

EXPOSE 3000
CMD ["npm", "run", "dev"]
