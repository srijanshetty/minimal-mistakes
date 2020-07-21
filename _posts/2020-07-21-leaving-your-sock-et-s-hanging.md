---
layout: post
title: Leaving Your Sock(et)s Hanging
modified:
categories: technical
excerpt:
tags: [python, websockets, async, exit, asyncio, dev, developer, threads, csp, sidecar, python3, 3.7]
image:
  feature:
comments: true
date: 2020-07-21T13:12:24+05:30
---

A command pattern that I’ve used in multiple projects is an event-loop sidecar. The sidecar runs on it's own thread and
does asynchronous IO; thereby increasing the responsiveness of the system which could be doing IO/CPU bound work. The
application (running on the main thread) interfaces with the sidecar through a synchronous API.<br/><br/>
There are multiple caveats to this pattern. With python's GIL, the sidecar should strictly be doing I/O to ensure that
the pattern has the desired effects. If you have a CPU bound sidecar, you'll end up with an architecture which performs
worse than a single threaded job.<br/><br/>
Setting up such a sidecar takes some time to get used to, but is easier in python 3.7+:

```python
def start(self):
    if self.sidecar_thread is None:
        self.sidecar_thread = threading.Thread(
            target=self._create_sidecar, args=(self.loop,)
        )
        self.sidecar_thread.start()


def _create_sidecar(self, loop: asyncio.BaseEventLoop):
    """
    Initialize the eventloop and setup a listener
    """

    # We use an event loop initialized in the main thread and use it
    # over here. This allows us to submit requests on a synchronous
    # fashion using create_task on the main thread and processing
    # happens in the sidecar
    asyncio.set_event_loop(loop)

    # Register a task for socket manager setup
    try:
        self.loop.run_until_complete(self._listener())
    except concurrent.futures.CancelledError as e:
        logging.error("Loop got shutdown, due to %s", e)


async def _listener(self):
    """
    Setup the connection and process messages
    """

    try:
        self._ws = await websockets.connect(self._uri)

        async for msg in self._ws:
            if self._has_error.is_set():
                raise errors.WebSocketError()

            # self._closing is called by exit which is described later
            if self._closing:
                break

            # Process messages here:
    except self.errors as b:
        # _has_error is ane Event to indicate that the socket has an error
        self._has_error.set()
        logging.warning("Error %s in WS, will raise WebSocketError", b)
    finally:
        # Close the connection and signal that we are done
        if self._ws:
            await self._ws.close()

        self._ws_has_closed.set()
```

The code takes getting used to. Hopefully the comments help in exposition. To be honest, in an earlier version,
we just let the application crash on socket errors without cleaning up. This led to gnarly memory issues, especially if
you have a long running job which reintializes this pattern.  This `exit protocol` to close the resource properly took
multiple iterations, but now has been perfected:

```python
def exit(self):
    """
    exit is called on the main thread and not on the sidecar
    """
    # Indicates the listener to stop processing any new messages
    self._closing = True

    # Busy loop and waits for the socket to close
    # NOTE: assumption is that listener gets triggered frequently
    start = time.time()
    while True:
        if self._ws_has_closed.is_set():
            break

        # If more than one minute is taken, just break the connection
        # NOTE: only minute is the max latency the application can tolerate,
        # before it gets repead by the scheduler in our case.
        time_elapsed = time.time() - start
        logging.warning(
            "Busy looping to close websocket, time elapsed %s", time_elapsed
        )
        if time_elapsed > consts.ONE_MINUTE:
            logging.error("Existing web socket without clearing connection")
            break

        # Busy loop
        time.sleep(consts.TEN_SECONDS)

    # Stop the loop now
    self.loop.stop()

    # Clean up all pending tasks
    for task in asyncio.all_tasks(self.loop):
        task.cancel()

    # Join with the sidecar
    if self.sidecar_thread is not None:
        self.sidecar_thread.join(constants.THREAD_JOIN_TIMEOUT)
        if self.sidecar_thread.isAlive():
            logging.error("Unable to clear up sidecar")
```

Every article on `asyncio` will advice you to close the thread and clean up pending tasks. But not article will tell you
that closing the thread will almost never work and end up with hard to debug errors. It took me a lot of head wrangling
to figure out the right protocol to correctly close a sidecar thread which uses an event loop:

- Stop processing new messages on the sidecar.
- Close the websocket connection, you will have to busy loop in order to do so.
- Close the loop and clear pending tasks.
- Join with the sidecar.

Missing any one of these steps is a path to an endless pit of *wats*. Especially the first two steps, which are taken
granted in languages which support such idioms out of the box like Java.
