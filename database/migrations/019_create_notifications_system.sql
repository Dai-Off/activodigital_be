-- Migration: Create notifications system
-- Description: Creates a basic notification system for user experience improvements

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get current user
    user_uuid := auth.uid();
    
    -- Check if user exists
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update notification if it belongs to the user
    UPDATE notifications 
    SET status = 'read', read_at = NOW()
    WHERE id = notification_id 
    AND user_id = user_uuid 
    AND status = 'unread';
    
    -- Return true if a row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
    user_uuid UUID;
    count_result INTEGER;
BEGIN
    -- Get current user
    user_uuid := auth.uid();
    
    -- Check if user exists
    IF user_uuid IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count unread notifications
    SELECT COUNT(*) INTO count_result
    FROM notifications 
    WHERE user_id = user_uuid 
    AND status = 'unread';
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count() TO authenticated;

-- Insert some notification types for reference (optional)
-- These are just examples, the actual types will be managed in the application
COMMENT ON TABLE notifications IS 'User notifications for better UX experience';
COMMENT ON COLUMN notifications.type IS 'Type of notification: ai_processing_start, ai_processing_progress, ai_processing_complete, ai_processing_error, etc.';
COMMENT ON COLUMN notifications.status IS 'Notification status: unread or read';
COMMENT ON COLUMN notifications.metadata IS 'Additional data related to the notification (JSON)';
