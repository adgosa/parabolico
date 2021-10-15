
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Answer.svelte generated by Svelte v3.43.1 */

    const file$6 = "src\\Answer.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let p;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(p, "class", "answer-text svelte-7dgmqe");
    			add_location(p, file$6, 5, 4, 85);
    			attr_dev(div, "class", "answer flex svelte-7dgmqe");
    			add_location(div, file$6, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(p, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(div, "click", /*click_handler*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Answer', slots, []);
    	let { text } = $$props;
    	const writable_props = ['text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Answer> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ text });

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, click_handler, click_handler_1];
    }

    class Answer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Answer",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !('text' in props)) {
    			console.warn("<Answer> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<Answer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Answer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    var cross = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\r\n<path d=\"M9.13086 7.50945L14.6986 1.94212C15.1428 1.49798 15.1428 0.7776 14.6986 0.333452C14.254 -0.111151 13.5341 -0.111151 13.09 0.333452L7.52219 5.90078L1.95487 0.333452C1.51072 -0.111151 0.789887 -0.111151 0.346194 0.333452C-0.0984088 0.7776 -0.0984088 1.49798 0.346194 1.94212L5.91352 7.50945L0.333452 13.09C-0.111151 13.5346 -0.111151 14.2545 0.333452 14.6986C0.555526 14.9207 0.846771 15.0317 1.13802 15.0317C1.42926 15.0317 1.7205 14.9207 1.94258 14.6986L7.52264 9.11812L13.09 14.6854C13.312 14.9075 13.6033 15.0186 13.8945 15.0186C14.1858 15.0186 14.4766 14.9075 14.6991 14.6854C15.1432 14.2408 15.1432 13.5209 14.6991 13.0768L9.13086 7.50945Z\" fill=\"#8C1717\"/>\r\n</svg>";

    var expand = "<svg width=\"18.75\" height=\"11.25\" viewBox=\"0 0 15 9\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\r\n<rect x=\"3\" y=\"1\" width=\"9\" height=\"1\" rx=\"0.5\" fill=\"#FFFDD9\" stroke=\"#FFFDD9\" stroke-width=\"0.5\"/>\r\n<rect x=\"1\" y=\"4\" width=\"13\" height=\"1\" rx=\"0.5\" fill=\"#FFFDD9\" stroke=\"#FFFDD9\" stroke-width=\"0.5\"/>\r\n<rect x=\"3\" y=\"7\" width=\"9\" height=\"1\" rx=\"0.5\" fill=\"#FFFDD9\" stroke=\"#FFFDD9\" stroke-width=\"0.5\"/>\r\n</svg>";

    var tick = "<svg width=\"16\" height=\"15\" viewBox=\"0 0 16 15\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\r\n<path d=\"M14.5977 0.206502C14.0038 -0.178573 13.2111 -0.00951563 12.8264 0.583893L5.65 11.6456L2.15017 8.40964C1.63062 7.92936 0.820764 7.96095 0.340486 8.4805C-0.139791 8.99963 -0.108199 9.81034 0.411354 10.2902L5.00665 14.5388C5.00665 14.5388 5.13856 14.6524 5.19961 14.6921C5.41477 14.8321 5.65641 14.8987 5.89548 14.8987C6.31471 14.8987 6.72582 14.6929 6.9713 14.3147L14.9751 1.97776C15.3601 1.38436 15.1911 0.591151 14.5977 0.206502Z\" fill=\"#178C31\"/>\r\n</svg>";

    /* src\results\Result.svelte generated by Svelte v3.43.1 */
    const file$5 = "src\\results\\Result.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (32:8) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "icon flex svelte-1k92pa8");
    			add_location(div, file$5, 32, 12, 842);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = cross;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(32:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:8) {#if hasAnsweredCorrectly}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "icon flex svelte-1k92pa8");
    			add_location(div, file$5, 28, 12, 738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = tick;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(28:8) {#if hasAnsweredCorrectly}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#if expanded}
    function create_if_block$1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let each_value = /*availableAnswers*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "expansion-container flex svelte-1k92pa8");
    			add_location(div, file$5, 45, 8, 1223);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableAnswers, validAnswerTitle, chosenAnswerTitle*/ 56) {
    				each_value = /*availableAnswers*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(45:4) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    // (52:16) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let t_value = /*answer*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "answer wrong-answer svelte-1k92pa8");
    			add_location(div, file$5, 52, 20, 1620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableAnswers*/ 8 && t_value !== (t_value = /*answer*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(52:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:55) 
    function create_if_block_2(ctx) {
    	let div;
    	let t_value = /*answer*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "answer chosen-answer svelte-1k92pa8");
    			add_location(div, file$5, 50, 20, 1525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableAnswers*/ 8 && t_value !== (t_value = /*answer*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(50:55) ",
    		ctx
    	});

    	return block;
    }

    // (48:16) {#if answer === validAnswerTitle}
    function create_if_block_1(ctx) {
    	let div;
    	let t_value = /*answer*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "answer valid-answer svelte-1k92pa8");
    			add_location(div, file$5, 48, 20, 1399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableAnswers*/ 8 && t_value !== (t_value = /*answer*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(48:16) {#if answer === validAnswerTitle}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#each availableAnswers as answer}
    function create_each_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*answer*/ ctx[8] === /*validAnswerTitle*/ ctx[4]) return create_if_block_1;
    		if (/*answer*/ ctx[8] === /*chosenAnswerTitle*/ ctx[5]) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(47:12) {#each availableAnswers as answer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div3;
    	let div2;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let p;
    	let t4;
    	let div1;
    	let div2_class_value;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*hasAnsweredCorrectly*/ ctx[0]) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*expanded*/ ctx[6] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			if_block0.c();
    			t0 = space();
    			h2 = element("h2");
    			t1 = text("#");
    			t2 = text(/*questionIndex*/ ctx[2]);
    			t3 = space();
    			div0 = element("div");
    			p = element("p");
    			t4 = space();
    			div1 = element("div");
    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(h2, "class", "index svelte-1k92pa8");
    			add_location(h2, file$5, 36, 8, 941);
    			attr_dev(p, "class", "question svelte-1k92pa8");
    			add_location(p, file$5, 38, 12, 1041);
    			attr_dev(div0, "class", "question-container flex svelte-1k92pa8");
    			add_location(div0, file$5, 37, 8, 990);
    			attr_dev(div1, "class", "icon flex expand svelte-1k92pa8");
    			add_location(div1, file$5, 40, 8, 1107);

    			attr_dev(div2, "class", div2_class_value = "container flex " + (/*hasAnsweredCorrectly*/ ctx[0]
    			? 'correct'
    			: 'incorrect') + " " + (/*expanded*/ ctx[6] ? '' : 'margin') + " svelte-1k92pa8");

    			add_location(div2, file$5, 21, 4, 505);
    			add_location(div3, file$5, 20, 0, 494);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			if_block0.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, h2);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			p.innerHTML = /*question*/ ctx[1];
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			div1.innerHTML = expand;
    			append_dev(div3, t5);
    			if (if_block1) if_block1.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*handleExpandClick*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div2, t0);
    				}
    			}

    			if (!current || dirty & /*questionIndex*/ 4) set_data_dev(t2, /*questionIndex*/ ctx[2]);
    			if (!current || dirty & /*question*/ 2) p.innerHTML = /*question*/ ctx[1];
    			if (!current || dirty & /*hasAnsweredCorrectly, expanded*/ 65 && div2_class_value !== (div2_class_value = "container flex " + (/*hasAnsweredCorrectly*/ ctx[0]
    			? 'correct'
    			: 'incorrect') + " " + (/*expanded*/ ctx[6] ? '' : 'margin') + " svelte-1k92pa8")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (/*expanded*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*expanded*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Result', slots, []);
    	let { hasAnsweredCorrectly } = $$props;
    	let { question } = $$props;
    	let { questionIndex } = $$props;
    	let { availableAnswers } = $$props;
    	let { validAnswerTitle } = $$props;
    	let { chosenAnswerTitle } = $$props;
    	let expanded;

    	function handleExpandClick() {
    		$$invalidate(6, expanded = !expanded);
    	}

    	const writable_props = [
    		'hasAnsweredCorrectly',
    		'question',
    		'questionIndex',
    		'availableAnswers',
    		'validAnswerTitle',
    		'chosenAnswerTitle'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Result> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('hasAnsweredCorrectly' in $$props) $$invalidate(0, hasAnsweredCorrectly = $$props.hasAnsweredCorrectly);
    		if ('question' in $$props) $$invalidate(1, question = $$props.question);
    		if ('questionIndex' in $$props) $$invalidate(2, questionIndex = $$props.questionIndex);
    		if ('availableAnswers' in $$props) $$invalidate(3, availableAnswers = $$props.availableAnswers);
    		if ('validAnswerTitle' in $$props) $$invalidate(4, validAnswerTitle = $$props.validAnswerTitle);
    		if ('chosenAnswerTitle' in $$props) $$invalidate(5, chosenAnswerTitle = $$props.chosenAnswerTitle);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		cross,
    		expand,
    		tick,
    		hasAnsweredCorrectly,
    		question,
    		questionIndex,
    		availableAnswers,
    		validAnswerTitle,
    		chosenAnswerTitle,
    		expanded,
    		handleExpandClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('hasAnsweredCorrectly' in $$props) $$invalidate(0, hasAnsweredCorrectly = $$props.hasAnsweredCorrectly);
    		if ('question' in $$props) $$invalidate(1, question = $$props.question);
    		if ('questionIndex' in $$props) $$invalidate(2, questionIndex = $$props.questionIndex);
    		if ('availableAnswers' in $$props) $$invalidate(3, availableAnswers = $$props.availableAnswers);
    		if ('validAnswerTitle' in $$props) $$invalidate(4, validAnswerTitle = $$props.validAnswerTitle);
    		if ('chosenAnswerTitle' in $$props) $$invalidate(5, chosenAnswerTitle = $$props.chosenAnswerTitle);
    		if ('expanded' in $$props) $$invalidate(6, expanded = $$props.expanded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hasAnsweredCorrectly,
    		question,
    		questionIndex,
    		availableAnswers,
    		validAnswerTitle,
    		chosenAnswerTitle,
    		expanded,
    		handleExpandClick
    	];
    }

    class Result extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			hasAnsweredCorrectly: 0,
    			question: 1,
    			questionIndex: 2,
    			availableAnswers: 3,
    			validAnswerTitle: 4,
    			chosenAnswerTitle: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Result",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hasAnsweredCorrectly*/ ctx[0] === undefined && !('hasAnsweredCorrectly' in props)) {
    			console.warn("<Result> was created without expected prop 'hasAnsweredCorrectly'");
    		}

    		if (/*question*/ ctx[1] === undefined && !('question' in props)) {
    			console.warn("<Result> was created without expected prop 'question'");
    		}

    		if (/*questionIndex*/ ctx[2] === undefined && !('questionIndex' in props)) {
    			console.warn("<Result> was created without expected prop 'questionIndex'");
    		}

    		if (/*availableAnswers*/ ctx[3] === undefined && !('availableAnswers' in props)) {
    			console.warn("<Result> was created without expected prop 'availableAnswers'");
    		}

    		if (/*validAnswerTitle*/ ctx[4] === undefined && !('validAnswerTitle' in props)) {
    			console.warn("<Result> was created without expected prop 'validAnswerTitle'");
    		}

    		if (/*chosenAnswerTitle*/ ctx[5] === undefined && !('chosenAnswerTitle' in props)) {
    			console.warn("<Result> was created without expected prop 'chosenAnswerTitle'");
    		}
    	}

    	get hasAnsweredCorrectly() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasAnsweredCorrectly(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get question() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set question(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get questionIndex() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questionIndex(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get availableAnswers() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set availableAnswers(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validAnswerTitle() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validAnswerTitle(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chosenAnswerTitle() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chosenAnswerTitle(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\results\Results.svelte generated by Svelte v3.43.1 */
    const file$4 = "src\\results\\Results.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (9:4) {#each qAArray as answeredQuestion}
    function create_each_block$1(ctx) {
    	let result;
    	let current;

    	result = new Result({
    			props: {
    				question: /*answeredQuestion*/ ctx[1].question.title,
    				hasAnsweredCorrectly: /*answeredQuestion*/ ctx[1].hasAnsweredCorrectly,
    				availableAnswers: /*answeredQuestion*/ ctx[1].question.answers,
    				questionIndex: /*answeredQuestion*/ ctx[1].questionIndex,
    				validAnswerTitle: /*answeredQuestion*/ ctx[1].validAnswerTitle,
    				chosenAnswerTitle: /*answeredQuestion*/ ctx[1].chosenAnswerTitle
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(result.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(result, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const result_changes = {};
    			if (dirty & /*qAArray*/ 1) result_changes.question = /*answeredQuestion*/ ctx[1].question.title;
    			if (dirty & /*qAArray*/ 1) result_changes.hasAnsweredCorrectly = /*answeredQuestion*/ ctx[1].hasAnsweredCorrectly;
    			if (dirty & /*qAArray*/ 1) result_changes.availableAnswers = /*answeredQuestion*/ ctx[1].question.answers;
    			if (dirty & /*qAArray*/ 1) result_changes.questionIndex = /*answeredQuestion*/ ctx[1].questionIndex;
    			if (dirty & /*qAArray*/ 1) result_changes.validAnswerTitle = /*answeredQuestion*/ ctx[1].validAnswerTitle;
    			if (dirty & /*qAArray*/ 1) result_changes.chosenAnswerTitle = /*answeredQuestion*/ ctx[1].chosenAnswerTitle;
    			result.$set(result_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(result.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(result.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(result, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(9:4) {#each qAArray as answeredQuestion}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let current;
    	let each_value = /*qAArray*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Resultados";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "results-title svelte-csxqtn");
    			add_location(h1, file$4, 6, 0, 93);
    			attr_dev(div, "class", "results flex svelte-csxqtn");
    			add_location(div, file$4, 7, 0, 136);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*qAArray*/ 1) {
    				each_value = /*qAArray*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Results', slots, []);
    	let { qAArray } = $$props;
    	const writable_props = ['qAArray'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Results> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('qAArray' in $$props) $$invalidate(0, qAArray = $$props.qAArray);
    	};

    	$$self.$capture_state = () => ({ Result, qAArray });

    	$$self.$inject_state = $$props => {
    		if ('qAArray' in $$props) $$invalidate(0, qAArray = $$props.qAArray);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [qAArray];
    }

    class Results extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { qAArray: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Results",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*qAArray*/ ctx[0] === undefined && !('qAArray' in props)) {
    			console.warn("<Results> was created without expected prop 'qAArray'");
    		}
    	}

    	get qAArray() {
    		throw new Error("<Results>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set qAArray(value) {
    		throw new Error("<Results>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Quiz.svelte generated by Svelte v3.43.1 */
    const file$3 = "src\\Quiz.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (46:0) {:else}
    function create_else_block(ctx) {
    	let results;
    	let current;

    	results = new Results({
    			props: { qAArray: /*answeredQuestions*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(results.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(results, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(results.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(results.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(results, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(46:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if stage !== maxQuestions}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let previous_key = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].title;
    	let t0;
    	let div1;
    	let t1;
    	let progress_1;
    	let div2_transition;
    	let current;
    	let key_block = create_key_block(ctx);
    	let each_value = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].answers;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			key_block.c();
    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			progress_1 = element("progress");
    			attr_dev(div0, "class", "header svelte-a0a5cv");
    			add_location(div0, file$3, 33, 8, 1059);
    			attr_dev(div1, "class", "answers flex svelte-a0a5cv");
    			add_location(div1, file$3, 38, 8, 1258);
    			attr_dev(progress_1, "class", "status svelte-a0a5cv");
    			attr_dev(progress_1, "max", /*maxQuestions*/ ctx[1]);
    			progress_1.value = /*$progress*/ ctx[3];
    			add_location(progress_1, file$3, 43, 8, 1476);
    			add_location(div2, file$3, 32, 4, 1027);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			key_block.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, progress_1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedQuestions, stage*/ 5 && safe_not_equal(previous_key, previous_key = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].title)) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(div0, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (dirty & /*selectedQuestions, stage, handleClick*/ 69) {
    				each_value = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].answers;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*maxQuestions*/ 2) {
    				attr_dev(progress_1, "max", /*maxQuestions*/ ctx[1]);
    			}

    			if (!current || dirty & /*$progress*/ 8) {
    				prop_dev(progress_1, "value", /*$progress*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			key_block.d(detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(32:0) {#if stage !== maxQuestions}",
    		ctx
    	});

    	return block;
    }

    // (35:12) {#key selectedQuestions[stage].title}
    function create_key_block(ctx) {
    	let h1;
    	let raw_value = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].title + "";
    	let h1_transition;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			attr_dev(h1, "class", "svelte-a0a5cv");
    			add_location(h1, file$3, 35, 16, 1148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			h1.innerHTML = raw_value;
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*selectedQuestions, stage*/ 5) && raw_value !== (raw_value = /*selectedQuestions*/ ctx[0][/*stage*/ ctx[2]].title + "")) h1.innerHTML = raw_value;		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_transition) h1_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(35:12) {#key selectedQuestions[stage].title}",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#each selectedQuestions[stage].answers as question, i}
    function create_each_block(ctx) {
    	let answer;
    	let current;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*i*/ ctx[10]);
    	}

    	answer = new Answer({
    			props: { text: /*question*/ ctx[8] },
    			$$inline: true
    		});

    	answer.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			create_component(answer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(answer, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const answer_changes = {};
    			if (dirty & /*selectedQuestions, stage*/ 5) answer_changes.text = /*question*/ ctx[8];
    			answer.$set(answer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(answer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(answer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(40:12) {#each selectedQuestions[stage].answers as question, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[2] !== /*maxQuestions*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Quiz', slots, []);
    	let { selectedQuestions } = $$props;
    	let { maxQuestions } = $$props;
    	const answeredQuestions = [];
    	const progress = tweened(0);
    	validate_store(progress, 'progress');
    	component_subscribe($$self, progress, value => $$invalidate(3, $progress = value));
    	let stage = 0;

    	function handleClick(clickedQuestionIndex) {
    		const question = selectedQuestions[stage];
    		const validAnswer = question.validAnswerIndex === clickedQuestionIndex;

    		answeredQuestions.push({
    			question,
    			questionIndex: stage + 1,
    			hasAnsweredCorrectly: validAnswer,
    			validAnswerTitle: question.answers[question.validAnswerIndex],
    			chosenAnswerTitle: question.answers[clickedQuestionIndex]
    		});

    		$$invalidate(2, stage++, stage);
    	}

    	const writable_props = ['selectedQuestions', 'maxQuestions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => handleClick(i);

    	$$self.$$set = $$props => {
    		if ('selectedQuestions' in $$props) $$invalidate(0, selectedQuestions = $$props.selectedQuestions);
    		if ('maxQuestions' in $$props) $$invalidate(1, maxQuestions = $$props.maxQuestions);
    	};

    	$$self.$capture_state = () => ({
    		Answer,
    		slide,
    		tweened,
    		Results,
    		selectedQuestions,
    		maxQuestions,
    		answeredQuestions,
    		progress,
    		stage,
    		handleClick,
    		$progress
    	});

    	$$self.$inject_state = $$props => {
    		if ('selectedQuestions' in $$props) $$invalidate(0, selectedQuestions = $$props.selectedQuestions);
    		if ('maxQuestions' in $$props) $$invalidate(1, maxQuestions = $$props.maxQuestions);
    		if ('stage' in $$props) $$invalidate(2, stage = $$props.stage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*stage*/ 4) {
    			progress.set(stage);
    		}
    	};

    	return [
    		selectedQuestions,
    		maxQuestions,
    		stage,
    		$progress,
    		answeredQuestions,
    		progress,
    		handleClick,
    		click_handler
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { selectedQuestions: 0, maxQuestions: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selectedQuestions*/ ctx[0] === undefined && !('selectedQuestions' in props)) {
    			console.warn("<Quiz> was created without expected prop 'selectedQuestions'");
    		}

    		if (/*maxQuestions*/ ctx[1] === undefined && !('maxQuestions' in props)) {
    			console.warn("<Quiz> was created without expected prop 'maxQuestions'");
    		}
    	}

    	get selectedQuestions() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedQuestions(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxQuestions() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxQuestions(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\QuizSection.svelte generated by Svelte v3.43.1 */
    const file$2 = "src\\QuizSection.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let quiz;
    	let current;

    	quiz = new Quiz({
    			props: {
    				selectedQuestions: /*selectedQuestions*/ ctx[0],
    				maxQuestions
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(quiz.$$.fragment);
    			attr_dev(div0, "class", "elements-container svelte-e1yf2o");
    			add_location(div0, file$2, 155, 4, 5173);
    			attr_dev(div1, "class", "outer-box svelte-e1yf2o");
    			add_location(div1, file$2, 154, 0, 5144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(quiz, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(quiz);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const maxQuestions = 10;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QuizSection', slots, []);

    	let availableQuestions = [
    		{
    			validAnswerIndex: 1,
    			title: "¿De qué grado es una función cuadrática?",
    			answers: ["Tercer grado", "Segundo grado", "Primer grado", "Ninguna es correcta"]
    		},
    		{
    			validAnswerIndex: 2,
    			title: "¿En qué método se utiliza la resolvente?",
    			answers: [
    				"Método parabólico",
    				"Método por tabla",
    				"Método directo",
    				"Método de segundo grado"
    			]
    		},
    		{
    			validAnswerIndex: 3,
    			title: "En la siguiente función: <code>y=4x^2-3x+2</code> ¿cuál es el valor de a, b y c?",
    			answers: ["-3;2;4", "2;-4;-3", "4;-3;2", "4;3;2"]
    		},
    		{
    			validAnswerIndex: 0,
    			title: "¿En qué afecta que el término cuadrático sea negativo o positivo?",
    			answers: [
    				"Determina si es creciente o decreciente",
    				"Determina si la función es par o impar",
    				"A y B son correctas",
    				"Ninguna es correcta"
    			]
    		},
    		{
    			validAnswerIndex: 1,
    			title: "¿La ecuación <code>y=x^3+3x-4</code> es correcta cuadráticamente?",
    			answers: ["Sí", "No"]
    		},
    		{
    			validAnswerIndex: 3,
    			title: "¿Qué letra representa al término independiente?",
    			answers: ["a", "b", "c", "Ninguna es correcta"]
    		},
    		{
    			validAnswerIndex: 1,
    			title: "¿Cómo se calcula la coord. al origen?",
    			answers: [
    				"Resolviendo la resolvente",
    				"Es el valor independiente",
    				"La suma de las raíces dividido 2",
    				"Ninguna es correcta"
    			]
    		},
    		{
    			validAnswerIndex: 1,
    			title: "La ecuación <code>y=x^2+7x</code> es:",
    			answers: ["Completa", "Incompleta", "Mixta"]
    		},
    		{
    			validAnswerIndex: 0,
    			title: "¿Qué es el discriminante?",
    			answers: [
    				"Lo que se encuentra dentro de la raíz de la resolvente",
    				"Es el sentido de la parábola",
    				"El resultado de la resolvente",
    				"Ninguna es correcta"
    			]
    		},
    		{
    			validAnswerIndex: 0,
    			title: "¿Qué termino es indispensable para una f. cuadrática?",
    			answers: ["a", "b", "c", "a;b"]
    		},
    		{
    			validAnswerIndex: 3,
    			title: "¿Cuándo una f. cuadrática está incompleta?",
    			answers: ["Al faltar b", "Al faltar c", "Al faltar b;c", "Todas son correctas"]
    		},
    		{
    			validAnswerIndex: 3,
    			title: "¿Cuál de estas afirmaciones es la correcta?",
    			answers: [
    				"La función es par si a 2 elementos opuestos del dominio le corresponden distinta imagen",
    				"La función es impar si a 2 elementos opuetos del dominio le corresponden distinta imagen",
    				"La función cuadrática forma una linea recta",
    				"Ninguna es correcta"
    			]
    		},
    		{
    			validAnswerIndex: 1,
    			title: "La representación de la f. cuadrática es una curva llamada:",
    			answers: ["Linea cuadrática", "Parábola", "Discriminante", "A y B son correctas"]
    		},
    		{
    			validAnswerIndex: 4,
    			title: "Dada la ecuación <code>y=x^2-2</code> ¿qué afirmación es correcta?",
    			answers: [
    				"Es par",
    				"Es impar",
    				"Es una ecuación incompleta",
    				"A y B son correctas",
    				"A y C son correctas",
    				"Ninguna es correcta"
    			]
    		},
    		{
    			validAnswerIndex: 4,
    			title: "Dada la ecuación <code>y=x^2+1</code> ¿qué afirmación es correcta?",
    			answers: [
    				"Es impar",
    				"Su imagen es [1,∞]",
    				"Es par",
    				"A y B son correctas",
    				"B y C son correctas",
    				"Ninguna es correcta"
    			]
    		}
    	];

    	let selectedQuestions = pickRandomQuestions(10);

    	function pickRandomQuestions(count) {
    		const tmp = availableQuestions.slice(availableQuestions);
    		const ret = [];

    		for (let i = 0; i < count; i++) {
    			let index = Math.floor(Math.random() * tmp.length);
    			const removed = tmp.splice(index, 1);
    			ret.push(removed[0]);
    		}

    		return ret;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QuizSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Quiz,
    		maxQuestions,
    		availableQuestions,
    		selectedQuestions,
    		pickRandomQuestions
    	});

    	$$self.$inject_state = $$props => {
    		if ('availableQuestions' in $$props) availableQuestions = $$props.availableQuestions;
    		if ('selectedQuestions' in $$props) $$invalidate(0, selectedQuestions = $$props.selectedQuestions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedQuestions];
    }

    class QuizSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuizSection",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Sections.svelte generated by Svelte v3.43.1 */
    const file$1 = "src\\Sections.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let section0;
    	let main;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let a;
    	let t5;
    	let section1;
    	let div0;
    	let h21;
    	let t7;
    	let p;
    	let t9;
    	let section2;
    	let quizsection;
    	let current;
    	quizsection = new QuizSection({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			section0 = element("section");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Parabólico";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Demuestra tus conocimientos con este quiz.";
    			t3 = space();
    			a = element("a");
    			a.textContent = "Jugar";
    			t5 = space();
    			section1 = element("section");
    			div0 = element("div");
    			h21 = element("h2");
    			h21.textContent = "¿Cómo se juega?";
    			t7 = space();
    			p = element("p");
    			p.textContent = "Podrás responder 10 preguntas. Cuando\r\n                hayas terminado, se te mostrarán los resultados.";
    			t9 = space();
    			section2 = element("section");
    			create_component(quizsection.$$.fragment);
    			attr_dev(h1, "class", "main-title svelte-1lboy7j");
    			add_location(h1, file$1, 7, 12, 186);
    			attr_dev(h20, "class", "main-subtitle svelte-1lboy7j");
    			add_location(h20, file$1, 8, 12, 238);
    			attr_dev(a, "class", "play-btn svelte-1lboy7j");
    			attr_dev(a, "href", "#play");
    			add_location(a, file$1, 11, 12, 357);
    			attr_dev(main, "class", "main svelte-1lboy7j");
    			add_location(main, file$1, 6, 8, 153);
    			attr_dev(section0, "class", "main-container flex svelte-1lboy7j");
    			add_location(section0, file$1, 5, 4, 106);
    			attr_dev(h21, "class", "play-title svelte-1lboy7j");
    			add_location(h21, file$1, 16, 12, 511);
    			attr_dev(p, "class", "play-paragraph svelte-1lboy7j");
    			add_location(p, file$1, 17, 12, 568);
    			attr_dev(div0, "class", "how-to-play-container flex svelte-1lboy7j");
    			add_location(div0, file$1, 15, 8, 457);
    			attr_dev(section1, "class", "svelte-1lboy7j");
    			add_location(section1, file$1, 14, 4, 438);
    			attr_dev(section2, "class", "svelte-1lboy7j");
    			add_location(section2, file$1, 23, 4, 771);
    			attr_dev(div1, "class", "container flex svelte-1lboy7j");
    			add_location(div1, file$1, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, section0);
    			append_dev(section0, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h20);
    			append_dev(main, t3);
    			append_dev(main, a);
    			append_dev(div1, t5);
    			append_dev(div1, section1);
    			append_dev(section1, div0);
    			append_dev(div0, h21);
    			append_dev(div0, t7);
    			append_dev(div0, p);
    			append_dev(div1, t9);
    			append_dev(div1, section2);
    			mount_component(quizsection, section2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quizsection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quizsection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(quizsection);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sections', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sections> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ QuizSection });
    	return [];
    }

    class Sections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sections",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Reset.svelte generated by Svelte v3.43.1 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Reset', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Reset> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Reset extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reset",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.43.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let style;
    	let t1;
    	let sections;
    	let t2;
    	let reset;
    	let current;
    	sections = new Sections({ $$inline: true });
    	reset = new Reset({ $$inline: true });

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "@import url(\"https://fonts.googleapis.com/css2?family=Signika+Negative:wght@400;700&display=swap\");\n        @import url(\"https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap\");";
    			t1 = space();
    			create_component(sections.$$.fragment);
    			t2 = space();
    			create_component(reset.$$.fragment);
    			add_location(style, file, 6, 4, 124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, style);
    			insert_dev(target, t1, anchor);
    			mount_component(sections, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(reset, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sections.$$.fragment, local);
    			transition_in(reset.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sections.$$.fragment, local);
    			transition_out(reset.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(style);
    			if (detaching) detach_dev(t1);
    			destroy_component(sections, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(reset, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Sections, Reset });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
