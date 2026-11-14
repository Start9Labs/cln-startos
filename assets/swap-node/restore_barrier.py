"""Shared restore fence. Never clear this marker or turn a backup into authority.

The restore hook must call fence() on stopped, restored data before any daemon
starts. It does not revoke credentials on an independently running original.
"""
import json
import os
from pathlib import Path
import stat

MARKER = 'swap-restored.json'
VALUE = dict(schema=1, format='swap-restore-barrier-v1', blocked=True)


def blocked(directory):
    p = Path(directory)
    paths = [p/'restored.json', p.parent/MARKER, p.parent/'node-restored.json']
    if p.parent.name in ('bitcoin', 'regtest'):
        paths += [p.parent.parent/MARKER, p.parent.parent/'node-restored.json']
    # Even an invalid file or dangling symlink blocks. Parsing must not turn a
    # damaged restore marker into permission to execute.
    for parent in p.parents:
        paths += [parent/MARKER, parent/'node-restored.json']
    return any(os.path.lexists(x) for x in paths)


def fence(root):
    root = Path(root)
    if any(p.is_symlink() for p in (root, *root.parents)):
        raise ValueError('restore_path_refused')
    st = root.stat()
    if not stat.S_ISDIR(st.st_mode) or st.st_uid != os.getuid() or st.st_mode & 0o077:
        raise ValueError('restore_directory_not_private')
    raw = (json.dumps(VALUE, sort_keys=True)+'\n').encode()
    try:
        fd = os.open(root/MARKER, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    except FileExistsError:
        # Do not repair, unlink or overwrite a damaged barrier.
        fd = os.open(root/MARKER, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, 'rb') as f:
            st = os.fstat(f.fileno())
            if (not stat.S_ISREG(st.st_mode) or st.st_uid != os.getuid()
                    or st.st_nlink != 1 or st.st_mode & 0o077 or f.read(4097) != raw):
                raise ValueError('restore_marker_invalid')
    else:
        with os.fdopen(fd, 'wb') as f:
            f.write(raw); f.flush(); os.fsync(f.fileno())
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try: os.fsync(fd)
    finally: os.close(fd)
    return dict(restored=True, execution_blocked=True)
