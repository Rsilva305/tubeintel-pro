#!/usr/bin/env python3
"""Noop Moloco SDK init to avoid kotlinx-coroutines Main dispatcher crash."""

from pathlib import Path

from patch_utils import patch_method_file

BASE = Path("/workspace/apk_analysis/apktool")
MOLOCO = BASE / "smali/com/moloco/sdk/publisher/Moloco.smali"

patch_method_file(
    MOLOCO,
    "initialize(Lcom/moloco/sdk/publisher/init/MolocoInitParams;)V",
    """.method public static final initialize(Lcom/moloco/sdk/publisher/init/MolocoInitParams;)V
    .locals 0
    .param p0    # Lcom/moloco/sdk/publisher/init/MolocoInitParams;
        .annotation build Lorg/jetbrains/annotations/NotNull;
        .end annotation
    .end param

    return-void
.end method""",
    "Moloco.initialize noop",
)

patch_method_file(
    MOLOCO,
    "initialize(Lcom/moloco/sdk/publisher/init/MolocoInitParams;Lcom/moloco/sdk/publisher/MolocoInitializationListener;)V",
    """.method public static final initialize(Lcom/moloco/sdk/publisher/init/MolocoInitParams;Lcom/moloco/sdk/publisher/MolocoInitializationListener;)V
    .locals 0
    .param p0    # Lcom/moloco/sdk/publisher/init/MolocoInitParams;
        .annotation build Lorg/jetbrains/annotations/NotNull;
        .end annotation
    .end param
    .param p1    # Lcom/moloco/sdk/publisher/MolocoInitializationListener;
        .annotation build Lorg/jetbrains/annotations/Nullable;
        .end annotation
    .end param

    return-void
.end method""",
    "Moloco.initialize(listener) noop",
)

print("Moloco patches applied.")
