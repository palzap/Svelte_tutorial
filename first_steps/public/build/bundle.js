
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
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
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
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
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
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
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
        if (text.data === data)
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

    /* src\Modal.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Modal.svelte";

    // (7:0) {#if showModal}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t = text(/*message*/ ctx[0]);
    			add_location(p, file$1, 10, 12, 321);
    			attr_dev(div0, "class", "modal svelte-1f2m7wu");
    			add_location(div0, file$1, 9, 8, 288);
    			attr_dev(div1, "class", "backdrop svelte-1f2m7wu");
    			toggle_class(div1, "promo", /*isPromo*/ ctx[2]);
    			add_location(div1, file$1, 8, 4, 220);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", self(/*click_handler*/ ctx[3]), false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) set_data_dev(t, /*message*/ ctx[0]);

    			if (dirty & /*isPromo*/ 4) {
    				toggle_class(div1, "promo", /*isPromo*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*showModal*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Modal', slots, []);
    	let { message = "This is a modal!" } = $$props;
    	let { showModal = false } = $$props;
    	let { isPromo = false } = $$props;
    	const writable_props = ['message', 'showModal', 'isPromo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('showModal' in $$props) $$invalidate(1, showModal = $$props.showModal);
    		if ('isPromo' in $$props) $$invalidate(2, isPromo = $$props.isPromo);
    	};

    	$$self.$capture_state = () => ({ message, showModal, isPromo });

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('showModal' in $$props) $$invalidate(1, showModal = $$props.showModal);
    		if ('isPromo' in $$props) $$invalidate(2, isPromo = $$props.isPromo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, showModal, isPromo, click_handler];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { message: 0, showModal: 1, isPromo: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get message() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showModal() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showModal(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isPromo() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isPromo(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (90:2) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No items found!";
    			add_location(p, file, 90, 3, 2389);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(90:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:3) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Odd";
    			add_location(p, file, 83, 4, 2210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(83:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:3) {#if item.id % 2 == 0}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Even";
    			add_location(p, file, 81, 4, 2181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(81:3) {#if item.id % 2 == 0}",
    		ctx
    	});

    	return block;
    }

    // (80:2) {#each items as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let t0;
    	let div;
    	let p;
    	let t1_value = /*item*/ ctx[17].name + "";
    	let t1;
    	let t2;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[17].id % 2 == 0) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*item*/ ctx[17]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if_block.c();
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			button.textContent = "delete";
    			t4 = space();
    			set_style(p, "color", /*item*/ ctx[17].color);
    			add_location(p, file, 86, 4, 2246);
    			add_location(button, file, 87, 4, 2298);
    			add_location(div, file, 85, 3, 2235);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(div, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			}

    			if (dirty & /*items*/ 32 && t1_value !== (t1_value = /*item*/ ctx[17].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 32) {
    				set_style(p, "color", /*item*/ ctx[17].color);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(80:2) {#each items as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let modal;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div;
    	let h4;
    	let p;
    	let t5;
    	let t6;
    	let t7;
    	let p_style_value;
    	let t8;
    	let label0;
    	let t10;
    	let input0;
    	let t11;
    	let label1;
    	let t13;
    	let input1;
    	let t14;
    	let label2;
    	let t16;
    	let input2;
    	let t17;
    	let label3;
    	let t19;
    	let input3;
    	let t20;
    	let h5;
    	let button0;
    	let t22;
    	let button1;
    	let t24;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;

    	modal = new Modal({
    			props: {
    				message: "" + (/*itemname*/ ctx[6] + " deleted!"),
    				showModal: /*showModal*/ ctx[7]
    			},
    			$$inline: true
    		});

    	modal.$on("click", /*toggleModal*/ ctx[12]);
    	let each_value = /*items*/ ctx[5];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[17].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1(ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(modal.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text("Hello ");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = text("!");
    			t4 = space();
    			div = element("div");
    			h4 = element("h4");
    			p = element("p");
    			t5 = text("My name is ");
    			t6 = text(/*fullName*/ ctx[3]);
    			t7 = text(".");
    			t8 = space();
    			label0 = element("label");
    			label0.textContent = "First Name";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			label1 = element("label");
    			label1.textContent = "Last Name";
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			label2 = element("label");
    			label2.textContent = "World name (with input handler)";
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			label3 = element("label");
    			label3.textContent = "World name (with binding)";
    			t19 = space();
    			input3 = element("input");
    			t20 = space();
    			h5 = element("h5");
    			button0 = element("button");
    			button0.textContent = "Change World!";
    			t22 = space();
    			button1 = element("button");
    			button1.textContent = "Change Color!";
    			t24 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file, 58, 1, 1423);
    			attr_dev(p, "style", p_style_value = "color :" + /*color*/ ctx[4]);
    			add_location(p, file, 62, 3, 1469);
    			attr_dev(label0, "for", "first_name");
    			add_location(label0, file, 64, 3, 1531);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "first_name");
    			add_location(input0, file, 65, 3, 1578);
    			attr_dev(label1, "for", "last_name");
    			add_location(label1, file, 66, 3, 1642);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "last_name");
    			add_location(input1, file, 67, 3, 1687);
    			attr_dev(label2, "for", "world");
    			add_location(label2, file, 69, 3, 1751);
    			attr_dev(input2, "type", "text");
    			input2.value = /*name*/ ctx[0];
    			add_location(input2, file, 70, 3, 1814);
    			attr_dev(label3, "for", "world");
    			add_location(label3, file, 71, 3, 1875);
    			attr_dev(input3, "type", "text");
    			add_location(input3, file, 72, 3, 1932);
    			add_location(h4, file, 61, 2, 1460);
    			add_location(button0, file, 75, 3, 1991);
    			add_location(button1, file, 76, 3, 2049);
    			add_location(h5, file, 74, 2, 1982);
    			add_location(div, file, 60, 1, 1451);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 56, 0, 1338);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(modal, main, null);
    			append_dev(main, t0);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(main, t4);
    			append_dev(main, div);
    			append_dev(div, h4);
    			append_dev(h4, p);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(h4, t8);
    			append_dev(h4, label0);
    			append_dev(h4, t10);
    			append_dev(h4, input0);
    			set_input_value(input0, /*first_name*/ ctx[1]);
    			append_dev(h4, t11);
    			append_dev(h4, label1);
    			append_dev(h4, t13);
    			append_dev(h4, input1);
    			set_input_value(input1, /*last_name*/ ctx[2]);
    			append_dev(h4, t14);
    			append_dev(h4, label2);
    			append_dev(h4, t16);
    			append_dev(h4, input2);
    			append_dev(h4, t17);
    			append_dev(h4, label3);
    			append_dev(h4, t19);
    			append_dev(h4, input3);
    			set_input_value(input3, /*name*/ ctx[0]);
    			append_dev(div, t20);
    			append_dev(div, h5);
    			append_dev(h5, button0);
    			append_dev(h5, t22);
    			append_dev(h5, button1);
    			append_dev(div, t24);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			if (each_1_else) {
    				each_1_else.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    					listen_dev(input2, "input", /*handleInput*/ ctx[9], false, false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[15]),
    					listen_dev(button0, "click", /*handleClick*/ ctx[8], false, false, false, false),
    					listen_dev(button1, "click", /*handleColor*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_changes = {};
    			if (dirty & /*itemname*/ 64) modal_changes.message = "" + (/*itemname*/ ctx[6] + " deleted!");
    			if (dirty & /*showModal*/ 128) modal_changes.showModal = /*showModal*/ ctx[7];
    			modal.$set(modal_changes);
    			if (!current || dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    			if (!current || dirty & /*fullName*/ 8) set_data_dev(t6, /*fullName*/ ctx[3]);

    			if (!current || dirty & /*color*/ 16 && p_style_value !== (p_style_value = "color :" + /*color*/ ctx[4])) {
    				attr_dev(p, "style", p_style_value);
    			}

    			if (dirty & /*first_name*/ 2 && input0.value !== /*first_name*/ ctx[1]) {
    				set_input_value(input0, /*first_name*/ ctx[1]);
    			}

    			if (dirty & /*last_name*/ 4 && input1.value !== /*last_name*/ ctx[2]) {
    				set_input_value(input1, /*last_name*/ ctx[2]);
    			}

    			if (!current || dirty & /*name*/ 1 && input2.value !== /*name*/ ctx[0]) {
    				prop_dev(input2, "value", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && input3.value !== /*name*/ ctx[0]) {
    				set_input_value(input3, /*name*/ ctx[0]);
    			}

    			if (dirty & /*deleteItem, items*/ 2080) {
    				each_value = /*items*/ ctx[5];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block_1(ctx);
    					each_1_else.c();
    					each_1_else.m(div, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(modal);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    			mounted = false;
    			run_all(dispose);
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
    	let fullName;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let first_name = 'John';
    	let last_name = 'Doe';
    	let color = 'black';

    	let items = [
    		{ id: 1, name: 'Item 1', color: 'red' },
    		{ id: 2, name: 'Item 2', color: 'green' },
    		{ id: 3, name: 'Item 3', color: 'blue' },
    		{ id: 4, name: 'Item 4', color: 'yellow' },
    		{ id: 5, name: 'Item 5', color: 'purple' },
    		{ id: 6, name: 'Item 6', color: 'orange' },
    		{ id: 7, name: 'Item 7', color: 'pink' },
    		{ id: 8, name: 'Item 8', color: 'brown' },
    		{ id: 9, name: 'Item 9', color: 'gray' },
    		{ id: 10, name: 'Item 10', color: 'black' }
    	];

    	let itemname = "";
    	let showModal = false;

    	const handleClick = () => {
    		$$invalidate(0, name = 'Another World');
    	};

    	const handleInput = event => {
    		$$invalidate(0, name = event.target.value);
    	};

    	const handleColor = () => {
    		if (color === 'blue') {
    			$$invalidate(4, color = 'black');
    			return;
    		}

    		$$invalidate(4, color = 'blue');
    	};

    	const deleteItem = id => {
    		$$invalidate(6, itemname = items.find(item => item.id == id).name);
    		$$invalidate(5, items = items.filter(item => item.id != id));
    		toggleModal();
    	};

    	const toggleModal = () => {
    		$$invalidate(7, showModal = !showModal);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		first_name = this.value;
    		$$invalidate(1, first_name);
    	}

    	function input1_input_handler() {
    		last_name = this.value;
    		$$invalidate(2, last_name);
    	}

    	function input3_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	const click_handler = item => deleteItem(item.id);

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Modal,
    		name,
    		first_name,
    		last_name,
    		color,
    		items,
    		itemname,
    		showModal,
    		handleClick,
    		handleInput,
    		handleColor,
    		deleteItem,
    		toggleModal,
    		fullName
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('first_name' in $$props) $$invalidate(1, first_name = $$props.first_name);
    		if ('last_name' in $$props) $$invalidate(2, last_name = $$props.last_name);
    		if ('color' in $$props) $$invalidate(4, color = $$props.color);
    		if ('items' in $$props) $$invalidate(5, items = $$props.items);
    		if ('itemname' in $$props) $$invalidate(6, itemname = $$props.itemname);
    		if ('showModal' in $$props) $$invalidate(7, showModal = $$props.showModal);
    		if ('fullName' in $$props) $$invalidate(3, fullName = $$props.fullName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*first_name, last_name*/ 6) {
    			$$invalidate(3, fullName = `${first_name} ${last_name}`);
    		}

    		if ($$self.$$.dirty & /*first_name, last_name, fullName*/ 14) {
    			{
    				console.log('First Name:', first_name);
    				console.log('Last Name:', last_name);
    				console.log('Full Name:', fullName);
    			}
    		}
    	};

    	return [
    		name,
    		first_name,
    		last_name,
    		fullName,
    		color,
    		items,
    		itemname,
    		showModal,
    		handleClick,
    		handleInput,
    		handleColor,
    		deleteItem,
    		toggleModal,
    		input0_input_handler,
    		input1_input_handler,
    		input3_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
