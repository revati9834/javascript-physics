window.addEventListener('load', function() {
    // plugins
    Matter.use(MatterWrap);

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const buyEl = document.querySelector('.buy');
    const buyBounding = buyEl.getBoundingClientRect();
    const buyRadius = buyBounding.width / 2;
    const buyX = buyBounding.left + buyRadius;
    const buyY = buyBounding.top + buyRadius;

    let floatingBodies = [];
    let lastScrollTop = document.documentElement.scrollTop;
    let scrollTimeout = null;
    let engineUpdateTimeout = null;
    let resizeTimeout = null;

    // matter.js has a built in random range function, but it is deterministic
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    // creates a randomized floating body
    function floatingBody() {
        let x = rand(0, viewportWidth);
        let y = rand(0, viewportHeight);

        return Matter.Bodies.circle(x, y, rand(50, 100), {
            frictionAir: 0.03,
            render: {
                fillStyle: (floatingBodies.length % 2 === 0) ? '#c5f6fa' : '#d0ebff'
            },
            plugin: {
                wrap: {
                    min: { x: 0, y: 0 },
                    max: { x: viewportWidth, y: viewportHeight }
                }
            }
        });
    }

    // throttle scrolling
    function onScrollThrottled() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(onScroll, 50);
        }
    }

    // push bodies around depending on scroll
    function onScroll() {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;

        let delta = (lastScrollTop - document.documentElement.scrollTop) / 50;
        floatingBodies.forEach((body) => {
            Matter.Body.setVelocity(body, {
                x: body.velocity.x + delta * rand(-0.5, 0.5),
                y: body.velocity.y + delta * rand(0.5, 1.5)
            });
        });

        lastScrollTop = document.documentElement.scrollTop;
    }

    // throttle engine updates
    function onEngineUpdateThrottled() {
        if (!engineUpdateTimeout) {
            engineUpdateTimeout = setTimeout(onEngineUpdate, 100);
        }
    }

    // update box element positioning
    function onEngineUpdate() {
        clearTimeout(engineUpdateTimeout);
        engineUpdateTimeout = null;

        let offsetX = buyBody.position.x - buyX;
        let offsetY = buyBody.position.y - buyY;
        
        if (Math.abs(offsetX) < 0.1 && Math.abs(offsetY) < 0.1) {
            // offsets are too tiny to matter, skip style update
            buyEl.style['transform'] = '';
        } else {
            buyEl.style['transform'] = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
        }
    }

    // throttle resize window
    function onResizeThrottled() {
        if (!resizeTimeout) {
            resizeTimeout = setTimeout(onResize, 400);
        }
    }

    // cheap fix if viewport changes, start over! (obviously demo purposes only)
    function onResize() {
        window.location.reload();
    }

    // engine
    let engine = Matter.Engine.create();
    engine.world.gravity.y = 0;

    // render
    let render = Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: viewportWidth,
            height: viewportHeight,
            wireframes: false,
            background: 'transparent'
        }
    });
    Matter.Render.run(render);

    // runner
    let runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // create body for buy element
    let buyBody = Matter.Bodies.circle(buyX, buyY, buyRadius, {
        render: { visible: false }
    });

    // constraing buy body to current buy element's position
    var buyConstraint = Matter.Constraint.create({
        pointA: { x: buyX, y: buyY },
        bodyB: buyBody,
        pointB: { x: 0, y: 0 },
        stiffness: 0.001,
        damping: 0.1,
        render: { visible: false }
    });

    Matter.World.add(engine.world, [buyBody, buyConstraint]);

    // add a number of floating bodies appropriate for amount of screen space
    let floatingBodiesCount = Math.round(viewportWidth * viewportHeight / 50000);
    for (let i = 0; i <= floatingBodiesCount; i++) {
        floatingBodies.push(floatingBody());
    }
    Matter.World.add(engine.world, floatingBodies);

    // wire events
    Matter.Events.on(engine, 'afterUpdate', onEngineUpdateThrottled);
    window.addEventListener('scroll', onScrollThrottled);
    window.addEventListener('resize', onResizeThrottled);
});
