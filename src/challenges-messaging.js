// Message Broker Drills — Kafka + RabbitMQ production patterns
// Syntax-checked exercises for broker config, consumer/producer patterns,
// delivery guarantees, and operational concerns.

var messagingChallenges = [
  // ═══════════════ RABBITMQ ═══════════════

  // ─── RABBITMQ: CONNECTION SETUP ─────────────────────────────────
  {
    id: 'amqp-connection',
    area: 'RabbitMQ',
    title: 'Connection — Heartbeat & Reconnect',
    difficulty: '★★☆',
    description: `Robust amqplib connection with heartbeat and error handling.
Write a connect() function that:
1. Creates a connection with heartbeat timeout (60s)
2. Creates a channel with prefetch(10)
3. Handles 'close' and 'error' events with reconnect logic
4. Uses async/await with try/catch

The connection url should be read from process.env.RABBITMQ_URL or default to amqp://localhost.`,
    starterCode: `const amqp = require('amqplib');

// Write connect() — robust connection with heartbeat
// and reconnect on close/error`,

    solutionCheck(code) {
      const errors = [];
      if (!/amqplib/.test(code)) errors.push('Import amqplib');
      if (!/heartbeat/.test(code)) errors.push('Set heartbeat (e.g. heartbeat: 60) in connect options');
      if (!/createChannel/.test(code)) errors.push('Create a channel with conn.createChannel()');
      if (!/prefetch/.test(code)) errors.push('Set channel.prefetch(10) for fair dispatch');
      if (!/async.*function.*connect/i.test(code) && !/const connect = async/.test(code))
        errors.push('connect() should be async');
      if (!/try/.test(code) || !/catch/.test(code))
        errors.push('Wrap connection logic in try/catch');
      if (!/process\.env\.RABBITMQ_URL/.test(code) && !/RABBITMQ_URL/.test(code))
        errors.push('Read RABBITMQ_URL from environment');
      if (!/close|error/.test(code))
        errors.push('Handle close/error events for reconnect');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Connection with heartbeat, prefetch, reconnect, and env-configurable URL.' };
    },
  },

  // ─── RABBITMQ: EXCHANGE TYPES ────────────────────────────────────
  {
    id: 'amqp-exchange-types',
    area: 'RabbitMQ',
    title: 'Exchange Types — Topic Routing',
    difficulty: '★★★',
    description: `Set up a topic exchange with multiple queues bound by routing patterns.
Requirements:
1. Declare a topic exchange named 'orders'
2. Create three queues: orders.us, orders.eu, orders.all
3. Bind orders.us with pattern "order.us.*"
4. Bind orders.eu with pattern "order.eu.*"
5. Bind orders.all with pattern "order.#"
6. Publish a test message with routing key "order.us.created"

Topic exchanges route based on dot-delimited routing keys with * (one word) and # (zero or more words) wildcards.`,
    starterCode: `const amqp = require('amqplib');

async function setupExchanges(channel) {
  // Declare a topic exchange and bind queues with routing patterns
}`,

    solutionCheck(code) {
      const errors = [];
      if (!/assertExchange.*topic/i.test(code) && !/assertExchange.*'orders'/.test(code))
        errors.push('Declare a topic exchange: ch.assertExchange(\'orders\', \'topic\', { durable: ... })');
      if (!/orders/.test(code)) errors.push('Exchange must be named \'orders\'');
      if (!/topic/i.test(code)) errors.push('Exchange type must be \'topic\'');
      if (!/orders\.us/.test(code)) errors.push('Create orders.us queue');
      if (!/orders\.eu/.test(code)) errors.push('Create orders.eu queue');
      if (!/orders\.all/.test(code)) errors.push('Create orders.all queue');
      if (!/order\.us\.\*/.test(code))
        errors.push('Bind orders.us with pattern "order.us.*" (matches order.us.created, order.us.updated)');
      if (!/order\.eu\.\*/.test(code))
        errors.push('Bind orders.eu with pattern "order.eu.*"');
      if (!/order\.#/.test(code))
        errors.push('Bind orders.all with pattern "order.#" (matches everything under order)');
      if (!/bindQueue/.test(code))
        errors.push('Use ch.bindQueue(queue, exchange, pattern)');
      if (!/publish/.test(code))
        errors.push('Publish a test message to verify routing');
      if (!/created/.test(code))
        errors.push('Use routing key "order.us.created" for the test message');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Topic exchange with proper routing patterns: order.us.* → US queue, order.eu.* → EU queue, order.# → all queue.' };
    },
  },

  // ─── RABBITMQ: DEAD LETTER QUEUE ─────────────────────────────────
  {
    id: 'amqp-dead-letter',
    area: 'RabbitMQ',
    title: 'Dead Letter Exchange — Poison Messages',
    difficulty: '★★★',
    description: `Configure a dead letter exchange (DLX) to handle failed messages.
Requirements:
1. Create a dead-letter exchange (type: direct) named 'orders.dlx'
2. Create a dead-letter queue 'orders.dead' bound to orders.dlx
3. Create the main queue 'orders.main' with x-dead-letter-exchange set to 'orders.dlx'
4. Set x-message-ttl on the main queue (optional, bonus)
5. Set x-dead-letter-routing-key so dead-lettered messages arrive with context

Dead letter exchanges catch: rejected messages (nack without requeue), expired TTL messages, and queue overflow.`,
    starterCode: `const amqp = require('amqplib');

async function setupDeadLetter(channel) {
  // Create DLX, dead letter queue, and main queue
  // with x-dead-letter-exchange configured
}`,

    solutionCheck(code) {
      const errors = [];
      if (!/orders\.dlx/.test(code))
        errors.push('Create a dead letter exchange named \'orders.dlx\'');
      if (!/orders\.dead/.test(code))
        errors.push('Create a dead letter queue \'orders.dead\'');
      if (!/orders\.main/.test(code))
        errors.push('Create the main queue \'orders.main\'');
      if (!/x-dead-letter-exchange/i.test(code))
        errors.push('Set x-dead-letter-exchange on the main queue to \'orders.dlx\'');
      if (!/dead/.test(code.toLowerCase()))
        errors.push('Name the DLX and DLQ with descriptive names indicating dead-letter purpose');
      if (/DLX/.test(code) && !/x-dead-letter-exchange/i.test(code))
        errors.push('x-dead-letter-exchange is the RabbitMQ argument name — use the full property');
      if (!/bindQueue/.test(code))
        errors.push('Bind the dead letter queue to the DLX');
      if (!/direct/.test(code))
        errors.push('DLX should be type \'direct\' for unambiguous routing');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Dead letter exchange configured: orders.main → orders.dlx → orders.dead.' };
    },
  },

  // ─── RABBITMQ: CONSUMER ACK PATTERNS ─────────────────────────────
  {
    id: 'amqp-consumer-ack',
    area: 'RabbitMQ',
    title: 'Consumer — Ack & Nack Patterns',
    difficulty: '★★☆',
    description: `Write a consumer that handles messages reliably.
Requirements:
1. Consume from a queue with { noAck: false } (manual acknowledgments)
2. On success: channel.ack(msg)
3. On known business error (invalid payload): channel.nack(msg, false, false) — discard, don't requeue
4. On transient error (DB down): channel.nack(msg, false, true) — requeue for retry
5. Wrap handler in try/catch

Manual acks prevent message loss. nack without requeue sends poison messages to DLX.`,
    starterCode: `const amqp = require('amqplib');

async function consume(channel) {
  // Consume with manual acks — handle success, business errors, and transient errors
}`,

    solutionCheck(code) {
      const errors = [];
      if (!/noAck.*false/.test(code) && !/noAck:\s*false/.test(code))
        errors.push('Set { noAck: false } for manual acknowledgments');
      if (!/\.ack\(/.test(code))
        errors.push('Call channel.ack(msg) on successful processing');
      if (!/\.nack\(/.test(code))
        errors.push('Call channel.nack(msg) for failures — differentiate requeue vs discard');
      if (!/false,\s*false/.test(code) && !/false,\s*true/.test(code))
        errors.push('nack(msg, allUpTo, requeue) — use false,false (discard) or false,true (requeue)');
      if (!/try/.test(code) || !/catch/.test(code))
        errors.push('Wrap handler in try/catch so unhandled errors also nack');
      if (!/consume/.test(code))
        errors.push('Use channel.consume(queue, handler, options)');
      if (/requeue/i.test(code) && !/nack.*true/.test(code))
        errors.push('requeue: true sends back to queue; requeue: false routes to DLX if configured');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Consumer with manual acks: ack on success, nack(discard) on poison, nack(requeue) on transient.' };
    },
  },

  // ═══════════════ KAFKA ═══════════════

  // ─── KAFKA: PRODUCER CONFIG ──────────────────────────────────────
  {
    id: 'kafka-producer-config',
    area: 'Kafka',
    title: 'Producer — Idempotent & Reliable',
    difficulty: '★★☆',
    description: `Configure a KafkaJS producer for reliable delivery.
Requirements:
1. Set clientId and brokers (localhost:9092)
2. Producer config: acks: -1 (all replicas), idempotent: true
3. Set compression (gzip) for throughput
4. Send a message with a key for partitioning
5. Handle send errors with try/catch

acks: -1 waits for all in-sync replicas. idempotent: true prevents duplicates during retries.`,
    starterCode: `const { Kafka } = require('kafkajs');

// Configure Kafka client and producer
// Send a message reliably`,

    solutionCheck(code) {
      const errors = [];
      if (!/kafkajs/.test(code)) errors.push('Import kafkajs');
      if (!/new Kafka/.test(code)) errors.push('Create a Kafka client: new Kafka({ clientId, brokers })');
      if (!/producer/.test(code)) errors.push('Create a producer: kafka.producer()');
      if (!/acks:\s*-1/.test(code))
        errors.push('Set acks: -1 to wait for all in-sync replicas');
      if (!/idempotent:\s*true/.test(code))
        errors.push('Set idempotent: true to prevent duplicate messages on retry');
      if (!/gzip/.test(code))
        errors.push('Set compression to gzip for better throughput');
      if (!/send\(/.test(code))
        errors.push('Call producer.send({ topic, messages: [{ key, value }] })');
      if (!/key/.test(code))
        errors.push('Include a message key for deterministic partitioning');
      if (!/try/.test(code) || !/catch/.test(code))
        errors.push('Wrap send in try/catch for error handling');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Producer: acks=-1, idempotent, gzip compression, keyed messages, error handling.' };
    },
  },

  // ─── KAFKA: CONSUMER GROUP & OFFSETS ─────────────────────────────
  {
    id: 'kafka-consumer-group',
    area: 'Kafka',
    title: 'Consumer Group — Offset Management',
    difficulty: '★★★',
    description: `Set up a Kafka consumer group with manual offset commits.
Requirements:
1. Consumer group 'order-processor'
2. Subscribe to topic 'orders'
3. Use fromBeginning: false (only new messages)
4. Each message: process, then manually commit offset
5. Handle consumer events: CONNECT, CRASH, DISCONNECT
6. Graceful shutdown on SIGTERM/SIGINT

Manual commits give you control over when a message is considered "done".`,
    starterCode: `const { Kafka } = require('kafkajs');

// Set up a consumer group with manual offset commits
// and graceful shutdown`,

    solutionCheck(code) {
      const errors = [];
      if (!/consumer/.test(code)) errors.push('Create a consumer: kafka.consumer({ groupId })');
      if (!/group.*order/.test(code))
        errors.push('Set groupId to \'order-processor\'');
      if (!/subscribe/.test(code))
        errors.push('Subscribe to a topic: consumer.subscribe({ topic, fromBeginning })');
      if (!/fromBeginning:\s*false/.test(code))
        errors.push('Set fromBeginning: false to only process new messages');
      if (!/commitOffsets/.test(code) && !/commit/.test(code))
        errors.push('Manually commit offsets after processing: consumer.commitOffsets()');
      if (!/eachMessage|eachBatch/.test(code))
        errors.push('Use eachMessage or eachBatch to process messages');
      if (!/SIGTERM|SIGINT|disconnect/.test(code))
        errors.push('Handle graceful shutdown: listen for SIGTERM/SIGINT and call consumer.disconnect()');
      if (!/CRASH|DISCONNECT|CONNECT/.test(code))
        errors.push('Listen for consumer events (CONNECT, DISCONNECT, CRASH)');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Consumer group with manual offset commits, fromBeginning: false, graceful shutdown.' };
    },
  },

  // ─── KAFKA: TOPIC CONFIGURATION ──────────────────────────────────
  {
    id: 'kafka-topic-config',
    area: 'Kafka',
    title: 'Topic — Partitioning & Retention',
    difficulty: '★★★',
    description: `Create a Kafka topic with proper configuration for a high-throughput order stream.
Requirements (via admin client):
1. Topic name: 'orders' with 6 partitions
2. Replication factor: 3
3. retention.ms: 7 days (604800000)
4. segment.bytes: 1GB (1073741824)
5. compression.type: producer (delegate to producer)
6. cleanup.policy: delete

Partition count = target throughput / single-partition throughput. For orders, assume 100K msg/s → 6 partitions.`,
    starterCode: `const { Kafka } = require('kafkajs');

// Use the admin client to create a topic
// with proper partitioning and retention`,

    solutionCheck(code) {
      const errors = [];
      if (!/admin/.test(code))
        errors.push('Use the admin client: kafka.admin()');
      if (!/createTopics/.test(code))
        errors.push('Call admin.createTopics({ topics: [...] })');
      if (!/numPartitions.*6/.test(code) && !/partitions.*6/.test(code))
        errors.push('Set 6 partitions for throughput');
      if (!/replicationFactor.*3/.test(code) && !/replication.*3/.test(code))
        errors.push('Set replicationFactor: 3 for fault tolerance');
      if (!/604800000/.test(code))
        errors.push('Set retention.ms to 604800000 (7 days)');
      if (!/1073741824/.test(code))
        errors.push('Set segment.bytes to 1073741824 (1GB) for segment sizing');
      if (!/compression/.test(code))
        errors.push('Set compression.type: \'producer\' to delegate to producer config');
      if (!/cleanup/.test(code) && !/delete/.test(code))
        errors.push('Set cleanup.policy: \'delete\'');
      if (!/disconnect/.test(code))
        errors.push('Disconnect the admin client after creating topics');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Topic: 6 partitions, rf=3, 7-day retention, 1GB segments, producer compression.' };
    },
  },

  // ─── KAFKA: EXACTLY-ONCE WITH TRANSACTIONS ───────────────────────
  {
    id: 'kafka-transactions',
    area: 'Kafka',
    title: 'Transactions — Exactly-Once Semantics',
    difficulty: '★★★★',
    description: `Use Kafka transactions to atomically produce to multiple topics and commit consumer offsets.
Requirements:
1. Producer with transactionalId and maxInFlightRequests: 1
2. Consumer with groupId, isolationLevel: read_committed
3. Transaction flow: init → begin → send → sendOffsets → commit (or abort on error)
4. Use consumer.run({ eachBatch: ... }) with resolveOffset and heartbeat
5. Handle abort on error

Transactions guarantee: messages are only visible after commit (read_committed), and offsets only advance with successful message delivery.`,
    starterCode: `const { Kafka } = require('kafkajs');

// Set up transactional producer + consumer
// Atomic produce-to-multiple-topics + offset commits`,

    solutionCheck(code) {
      const errors = [];
      if (!/transactionalId/.test(code))
        errors.push('Producer must have a transactionalId for exactly-once');
      if (!/maxInFlightRequests:\s*1/.test(code))
        errors.push('Set maxInFlightRequests: 1 — required for transactional ordering guarantees');
      if (!/read_committed/.test(code))
        errors.push('Consumer must use isolationLevel: read_committed to only see committed messages');
      if (!/transaction/.test(code) || !/sendOffsets/.test(code))
        errors.push('Transaction flow: producer.transaction() → begin → send → sendOffsets → commit');
      if (!/begin|init/.test(code))
        errors.push('Call transaction.begin() before sending');
      if (!/commit/.test(code))
        errors.push('Call transaction.commit() on success');
      if (!/abort/.test(code))
        errors.push('Call transaction.abort() on error to rollback');
      if (!/sendOffsets/.test(code))
        errors.push('Use sendOffsets to atomically commit consumer offsets with producer messages');
      if (!/eachBatch/.test(code))
        errors.push('Use eachBatch (not eachMessage) for transactional batching');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Transactions: transactionalId, read_committed, begin→send→sendOffsets→commit flow with abort on error.' };
    },
  },
];

export default messagingChallenges;
