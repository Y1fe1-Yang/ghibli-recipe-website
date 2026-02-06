// 生成队列管理器 - 用户请求优先，批量生成次之

class GenerationQueue {
    constructor() {
        this.userQueue = [];      // 用户请求队列（高优先级）
        this.batchQueue = [];     // 批量生成队列（低优先级）
        this.isProcessing = false;
        this.currentTask = null;
        this.stats = {
            userGenerated: 0,
            batchGenerated: 0,
            failed: 0,
            totalTime: 0
        };
    }

    // 添加用户请求（最高优先级）
    addUserRequest(dishName, language, resolve, reject) {
        console.log(`📥 [用户请求] ${dishName} (${language}) - 立即插入队列前端`);
        this.userQueue.push({
            dishName,
            language: language || 'zh',
            type: 'user',
            resolve,
            reject,
            timestamp: Date.now()
        });
        this.processNext();
    }

    // 添加批量生成请求（低优先级）
    addBatchRequest(dishName, language, resolve, reject) {
        this.batchQueue.push({
            dishName,
            language: language || 'zh',
            type: 'batch',
            resolve,
            reject,
            timestamp: Date.now()
        });
        this.processNext();
    }

    // 处理下一个任务
    async processNext() {
        if (this.isProcessing) {
            return; // 已经在处理中
        }

        // 优先处理用户请求
        let task = this.userQueue.shift() || this.batchQueue.shift();

        if (!task) {
            return; // 队列为空
        }

        this.isProcessing = true;
        this.currentTask = task;

        const startTime = Date.now();
        console.log(`\n🔄 [${task.type === 'user' ? '用户优先' : '批量生成'}] 开始处理: ${task.dishName}`);
        console.log(`📊 队列状态: 用户=${this.userQueue.length}, 批量=${this.batchQueue.length}`);

        try {
            // Wrap in Promise.race with timeout
            const timeoutMs = 360000; // 6 minutes timeout (generous for 8 images)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Generation timeout after 6 minutes')), timeoutMs);
            });

            const result = await Promise.race([
                this.generateRecipe(task.dishName, task.language),
                timeoutPromise
            ]);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            this.stats.totalTime += Date.now() - startTime;
            if (task.type === 'user') {
                this.stats.userGenerated++;
            } else {
                this.stats.batchGenerated++;
            }

            console.log(`✅ [${task.type}] ${task.dishName} 完成 (${elapsed}秒)`);
            task.resolve(result);
        } catch (error) {
            this.stats.failed++;
            console.error(`❌ [${task.type}] ${task.dishName} 失败:`, error.message);
            console.error('Error stack:', error.stack);
            task.reject(error);
        } finally {
            this.isProcessing = false;
            this.currentTask = null;

            // 立即处理下一个任务
            setTimeout(() => this.processNext(), 1000); // 1秒间隔避免API限流
        }
    }

    // 实际生成逻辑（会在 index.js 中注入）
    async generateRecipe(dishName) {
        throw new Error('generateRecipe method not implemented');
    }

    // 获取队列状态
    getStatus() {
        return {
            userQueue: this.userQueue.length,
            batchQueue: this.batchQueue.length,
            isProcessing: this.isProcessing,
            currentTask: this.currentTask ? {
                dishName: this.currentTask.dishName,
                type: this.currentTask.type
            } : null,
            stats: this.stats
        };
    }

    // 清空批量队列（紧急情况）
    clearBatchQueue() {
        const count = this.batchQueue.length;
        this.batchQueue = [];
        console.log(`🗑️  清空批量队列: ${count} 个任务`);
        return count;
    }
}

module.exports = new GenerationQueue();
